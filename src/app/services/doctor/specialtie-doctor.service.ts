import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  SpecialtieDoctor,
  SpecialtieDoctorFilters,
} from '../../models/doctor/specialtie-doctor.model';
import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({ providedIn: 'root' })
export class SpecialtieDoctorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/specialtiedoctor`;

  list(filters: SpecialtieDoctorFilters = {}): Observable<SpecialtieDoctor[]> {
    const hasFilter = Object.values(filters).some((value) => value !== null && value !== '');
    return hasFilter
      ? this.http.get<SpecialtieDoctor[]>(`${this.url}/filter`, {
          params: toHttpParams(filters),
        })
      : this.http.get<SpecialtieDoctor[]>(this.url);
  }

  getById(id: string): Observable<SpecialtieDoctor> {
    return this.http.get<SpecialtieDoctor>(`${this.url}/${id}`);
  }

  create(relation: SpecialtieDoctor): Observable<SpecialtieDoctor> {
    return this.http.post<SpecialtieDoctor>(this.url, relation);
  }

  update(id: string, relation: SpecialtieDoctor): Observable<SpecialtieDoctor> {
    return this.http.put<SpecialtieDoctor>(this.url, relation, { params: { id } });
  }

  // No hay `activate` ni campo `active`: "desactivar" borra la relación en el procesador.
  remove(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/deactivate`, null);
  }
}