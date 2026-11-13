import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TutorPet, TutorPetRequest } from '../../models/tutor-pet/tutor-pet.model';

@Injectable({ providedIn: 'root' })
export class TutorPetService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tutorPet`;

  list(): Observable<TutorPet[]> {
    return this.http.get<TutorPet[]>(this.url);
  }

  getById(id: string): Observable<TutorPet> {
    return this.http.get<TutorPet>(`${this.url}/${id}`);
  }

  getByPersonId(personId: string): Observable<TutorPet[]> {
    const params = new HttpParams().set('id', personId);
    return this.http.get<TutorPet[]>(`${this.url}/filter`, { params });
  }

  create(request: TutorPetRequest): Observable<TutorPet> {
    return this.http.post<TutorPet>(this.url, request);
  }

  update(id: string, request: TutorPetRequest): Observable<TutorPet> {
    const params = new HttpParams().set('id', id);
    return this.http.put<TutorPet>(this.url, request, { params });
  }

  deactivate(id: string): Observable<void> {
    const params = new HttpParams().set('id', id);
    return this.http.put<void>(`${this.url}/deactivate`, null, { params });
  }
}