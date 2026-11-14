import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, concatMap, first, of, take, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AcceptedResponse,
  Appointment,
  AppointmentDoctor,
  AppointmentFilters,
  AppointmentRequest,
  AppointmentStatusRequest,
} from '../../models/appointment/appointment.model';
import { toHttpParams } from '../../utils/shared/http-params';

// Crear, actualizar y cambiar de estado son asíncronos: la API valida, publica el mensaje en RabbitMQ
// y responde 202. La cita la guarda el procesador de salud un momento después. Por eso `waitUntil`
// consulta la cita hasta ver el cambio aplicado.
export const POLL_START_MS = 400;
export const POLL_EVERY_MS = 700;
export const POLL_ATTEMPTS = 12;

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/appointments`;

  list(filters: AppointmentFilters = {}): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.url, { params: toHttpParams(filters) });
  }

  getById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.url}/appointment`, {
      params: new HttpParams().set('id', id),
    });
  }

  // Médico de la sesión (404 si la persona no es médico).
  ownDoctor(): Observable<AppointmentDoctor> {
    return this.http.get<AppointmentDoctor>(`${this.url}/me/doctor`);
  }

  pendingByTutor(tutorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.url}/pending`, {
      params: new HttpParams().set('tutorId', tutorId),
    });
  }

  create(request: AppointmentRequest): Observable<AcceptedResponse> {
    return this.http.post<AcceptedResponse>(this.url, request);
  }

  // El id va en la query (?id=), no en la ruta.
  update(id: string, request: AppointmentRequest): Observable<AcceptedResponse> {
    return this.http.put<AcceptedResponse>(this.url, request, {
      params: new HttpParams().set('id', id),
    });
  }

  changeStatus(id: string, request: AppointmentStatusRequest): Observable<AcceptedResponse> {
    return this.http.patch<AcceptedResponse>(`${this.url}/${id}/status`, request);
  }

  // Este sí es síncrono: borra la cita y responde 204.
  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url, { params: new HttpParams().set('id', id) });
  }

  // Consulta la cita cada POLL_EVERY_MS hasta que `isApplied` se cumpla. Emite la cita ya
  // actualizada, o null si no se vio el cambio a tiempo (el procesador está apagado, la cola está
  // atrasada o el procesador rechazó el mensaje). Un 404 cuenta como "todavía no".
  waitUntil(
    id: string,
    isApplied: (appointment: Appointment) => boolean,
  ): Observable<Appointment | null> {
    return timer(POLL_START_MS, POLL_EVERY_MS).pipe(
      take(POLL_ATTEMPTS),
      concatMap(() => this.getById(id).pipe(catchError(() => of(null)))),
      first(
        (appointment): appointment is Appointment => appointment !== null && isApplied(appointment),
        null,
      ),
    );
  }
}
