import { Injectable, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Head, Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';
import { Headquarter, HeadquarterPayload } from '../../models/headquarter/headquarter.model';

@Injectable({ providedIn: 'root' })
export class HeadquarterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/headquarter`;
  private cache: Observable<Headquarter[]> | null = null;

  constructor() {
    const session = inject(SessionService);
    effect(() => {
      session.profile();
      this.refresh();
    });
  }

  list(): Observable<Headquarter[]> {
    if (this.cache === null) {
      this.cache = this.http
        .get<Headquarter[]>(this.baseUrl)
        .pipe(tap({ error: () => this.refresh() }), shareReplay(1));
    }
    return this.cache;
  }

  getById(id: string): Observable<Headquarter> {
    return this.http.get<Headquarter>(`${this.baseUrl}/${id}`);
  }

  create(headquarter: HeadquarterPayload): Observable<Headquarter> {
    return this.http
    .post<Headquarter>(this.baseUrl, headquarter)
    .pipe(tap(() => this.refresh()));
  }

  update(id: string, headquarter: HeadquarterPayload): Observable<Headquarter> {
    return this.http
    .put<Headquarter>(`${this.baseUrl}/${id}`, headquarter)
    .pipe(tap(() => this.refresh()));
  }

  deactivate(id: string) : Observable<Headquarter> {
    return this.http
    .patch<Headquarter>(`${this.baseUrl}/${id}/deactivate`, {})
    .pipe(tap(() => this.refresh()));
  }

  refresh(): void {
    this.cache = null;
  }
}
