import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Space, SpaceChanges } from '../../models/space/space.model';

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/spaces`;

  // Con sede activa se piden solo sus espacios sin ella los de toda la clínica.
  list(headquarterId: string | null = null): Observable<Space[]> {
    return headquarterId
      ? this.http.get<Space[]>(`${this.url}/headquarter/${headquarterId}`)
      : this.http.get<Space[]>(this.url);
  }

  // La informacion de un espacio se pide por su codigo 
  getByCode(code: string): Observable<Space> {
    return this.http.get<Space>(`${this.url}/code/${encodeURIComponent(code)}`);
  }

  // API 202= el procesador lo guarda 
  create(space: Space): Observable<Space> {
    return this.http.post<Space>(this.url, space);
  }

  // 202=muestra como va a quedar el espacio
  patch(id: string, changes: SpaceChanges): Observable<Space> {
    return this.http.patch<Space>(`${this.url}/${id}`, changes);
  }

  deactivate(id: string): Observable<Space> {
    return this.patch(id, { active: false });
  }

  activate(id: string): Observable<Space> {
    return this.patch(id, { active: true });
  }
}