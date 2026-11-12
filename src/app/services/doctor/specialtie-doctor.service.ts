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

  list(
    headquarterId: string,
    filters: SpecialtieDoctorFilters = {},
  ): Observable<SpecialtieDoctor[]> {
    const hasFilter = Object.values(filters).some((value) => value !== null && value !== '');
    const params = toHttpParams({ headquarterId, ...filters });
    return this.http.get<SpecialtieDoctor[]>(hasFilter ? `${this.url}/filter` : this.url, {
      params,
    });
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

  remove(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/deactivate`, null);
  }
}