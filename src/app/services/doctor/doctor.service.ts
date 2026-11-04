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
  idPerson?: string | null;
}

function fromApi(raw: DoctorApi): Doctor {
  return {
    id: raw.id ?? null,
    idPerson: raw.person ?? raw.idPerson ?? '',
    licenseNumber: raw.licenseNumber,
  };
}


function toApi(doctor: Doctor): DoctorApi {
  return { person: doctor.idPerson, idPerson: doctor.idPerson, licenseNumber: doctor.licenseNumber };
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/doctor`;

  list(filters: DoctorFilters = {}): Observable<Doctor[]> {
    const hasFilter = Object.values(filters).some((value) => value !== null && value !== '');
    const request = hasFilter
      ? this.http.get<DoctorApi[]>(`${this.url}/filter`, { params: toHttpParams(filters) })
      : this.http.get<DoctorApi[]>(this.url);
    return request.pipe(map((doctors) => doctors.map(fromApi)));
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

  // El estado activo vive en Person: la API cambia la persona asociada.
  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/deactivate`, null);
  }
}