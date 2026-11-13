import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Doctor, DoctorFilters } from '../../models/doctor/doctor.model';
import { toHttpParams } from '../../utils/shared/http-params';


interface DoctorApi {
  id?: string | null;
  licenseNumber: string;
  person?: string | null;
  headquarterId: string;
}

function fromApi(raw: DoctorApi): Doctor {
  return {
    id: raw.id ?? null,
    idPerson: raw.person ?? '',
    licenseNumber: raw.licenseNumber,
    headquarterId: raw.headquarterId,
  };
}

function toApi(doctor: Doctor): DoctorApi {
  return {
    person: doctor.idPerson,
    licenseNumber: doctor.licenseNumber,
    headquarterId: doctor.headquarterId,
  };
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/doctor`;

  list(headquarterId: string, filters: DoctorFilters = {}): Observable<Doctor[]> {
    const hasFilter = Object.values(filters).some((value) => value !== null && value !== '');
    const params = toHttpParams({ headquarterId, ...filters });
    return this.http
      .get<DoctorApi[]>(hasFilter ? `${this.url}/filter` : this.url, { params })
      .pipe(map((doctors) => doctors.map(fromApi)));
  }

  getById(id: string): Observable<Doctor> {
    return this.http.get<DoctorApi>(`${this.url}/${id}`).pipe(map(fromApi));
  }

  create(doctor: Doctor): Observable<Doctor> {
    return this.http.post<DoctorApi>(this.url, toApi(doctor)).pipe(map(fromApi));
  }

  update(id: string, doctor: Doctor): Observable<Doctor> {
    return this.http.put<DoctorApi>(this.url, toApi(doctor), { params: { id } }).pipe(map(fromApi));
  }

  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/deactivate`, null);
  }
}