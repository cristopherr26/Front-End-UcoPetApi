import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  RejectSpecialtieDoctorRequest,
  SpecialtieDoctor,
  SpecialtieDoctorFilters,
  SpecialtieDoctorRequest,
} from '../../models/specialtie/specialtie-doctor.model';
import { toHttpParams } from '../../utils/shared/http-params';

// Asignaciones médico-especialidad con su certificado y verificación.
// Las escrituras son síncronas: el backend guarda y luego publica en RabbitMQ.
@Injectable({ providedIn: 'root' })
export class SpecialtieDoctorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/specialtiedoctor`;

  // Todas las asignaciones de la sede
  list(headquarterId: string): Observable<SpecialtieDoctor[]> {
    return this.http.get<SpecialtieDoctor[]>(this.url, { params: toHttpParams({ headquarterId }) });
  }

  // Filtro en el backend por médico, especialidad y estado
  filter(headquarterId: string, filters: SpecialtieDoctorFilters): Observable<SpecialtieDoctor[]> {
    return this.http.get<SpecialtieDoctor[]>(`${this.url}/filter`, {
      params: toHttpParams({ headquarterId, ...filters }),
    });
  }

  // Solo VERIFIED y activas
  verified(
    headquarterId: string,
    idSpecialtie: string | null = null,
  ): Observable<SpecialtieDoctor[]> {
    return this.http.get<SpecialtieDoctor[]>(`${this.url}/verified`, {
      params: toHttpParams({ headquarterId, idSpecialtie }),
    });
  }

  getById(id: string): Observable<SpecialtieDoctor> {
    return this.http.get<SpecialtieDoctor>(`${this.url}/${id}`);
  }

  create(request: SpecialtieDoctorRequest): Observable<SpecialtieDoctor> {
    return this.http.post<SpecialtieDoctor>(this.url, toBody(request));
  }

  update(id: string, request: SpecialtieDoctorRequest): Observable<SpecialtieDoctor> {
    return this.http.put<SpecialtieDoctor>(this.url, toBody(request), { params: { id } });
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/deactivate`, null);
  }

  verify(id: string): Observable<SpecialtieDoctor> {
    return this.http.patch<SpecialtieDoctor>(`${this.url}/${id}/verify`, null);
  }

  reject(id: string, reason: string): Observable<SpecialtieDoctor> {
    const body: RejectSpecialtieDoctorRequest = { reason };
    return this.http.patch<SpecialtieDoctor>(`${this.url}/${id}/reject`, body);
  }
}

// Se arma el cuerpo campo a campo para no enviar nunca id, status ni datos de verificación
function toBody(request: SpecialtieDoctorRequest): SpecialtieDoctorRequest {
  const notes = request.certificateNotes?.trim() ?? '';
  return {
    doctor: request.doctor,
    specialtie: request.specialtie,
    headquarterId: request.headquarterId,
    certificateUrl: request.certificateUrl.trim(),
    certificateNotes: notes === '' ? null : notes,
  };
}
