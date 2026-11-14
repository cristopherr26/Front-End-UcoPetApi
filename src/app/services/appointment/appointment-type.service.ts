import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppointmentType } from '../../models/appointment/appointment-type.model';

// Los tipos de cita se guardan directo en la BD (sin RabbitMQ): crear responde 201,
// actualizar y cambiar el estado responden 200 con el tipo, y borrar responde 204.
@Injectable({ providedIn: 'root' })
export class AppointmentTypeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/appointments/appointment-type`;

  list(): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(this.url);
  }

  listActive(): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(`${this.url}/active`);
  }

  getById(id: string): Observable<AppointmentType> {
    return this.http.get<AppointmentType>(`${this.url}/detail`, {
      params: new HttpParams().set('id', id),
    });
  }

  create(type: AppointmentType): Observable<AppointmentType> {
    return this.http.post<AppointmentType>(this.url, type);
  }

  update(id: string, type: AppointmentType): Observable<AppointmentType> {
    return this.http.put<AppointmentType>(this.url, type, {
      params: new HttpParams().set('id', id),
    });
  }

  setActive(id: string, isActive: boolean): Observable<AppointmentType> {
    return this.http.patch<AppointmentType>(`${this.url}/${id}/status`, { isActive });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url, { params: new HttpParams().set('id', id) });
  }
}
