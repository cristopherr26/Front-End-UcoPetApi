import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  DocumentTypeOption,
  Person,
  SetPasswordRequest,
} from '../../models/person/person.model';
import { PersonLookupService } from './person-lookup.service';

const FALLBACK_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro civil' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
];

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly lookup = inject(PersonLookupService);
  private readonly url = `${environment.apiUrl}/persons`;

  private documentTypesCache: Observable<DocumentTypeOption[]> | null = null;

  list(): Observable<Person[]> {
    return this.http.get<Person[]>(this.url);
  }

  getById(id: string): Observable<Person> {
    return this.http.get<Person>(`${this.url}/${id}`);
  }

  me(): Observable<Person> {
    return this.http.get<Person>(`${this.url}/me`);
  }

  documentTypes(): Observable<DocumentTypeOption[]> {
    if (this.documentTypesCache === null) {
      this.documentTypesCache = this.http
        .get<DocumentTypeOption[]>(`${this.url}/document-types`)
        .pipe(
          catchError(() => of(FALLBACK_DOCUMENT_TYPES)),
          shareReplay(1),
        );
    }
    return this.documentTypesCache;
  }

  create(person: Person): Observable<Person> {
    return this.http.post<Person>(this.url, person).pipe(tap(() => this.lookup.refresh()));
  }

  update(id: string, person: Person): Observable<Person> {
    return this.http
      .put<Person>(`${this.url}/${id}`, person)
      .pipe(tap(() => this.lookup.refresh()));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.lookup.refresh()));
  }

  setPassword(id: string, request: SetPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/password`, request);
  }

  changeOwnPassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/me/password`, request);
  }
}
