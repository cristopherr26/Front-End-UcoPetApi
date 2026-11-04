import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PersonSummary } from '../../models/person/person.model';


@Injectable({ providedIn: 'root' })
export class PersonLookupService {
  private readonly http = inject(HttpClient);
  private cache: Observable<Map<string, PersonSummary>> | null = null;

  byId(): Observable<Map<string, PersonSummary>> {
    if (this.cache === null) {
      this.cache = this.http.get<PersonSummary[]>(`${environment.apiUrl}/persons`).pipe(
        map((persons) => new Map((Array.isArray(persons) ? persons : []).map((p) => [p.id, p]))),
        catchError(() => of(new Map<string, PersonSummary>())),
        shareReplay(1),
      );
    }
    return this.cache;
  }

  refresh(): void {
    this.cache = null;
  }
}