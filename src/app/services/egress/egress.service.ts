import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Egress, EgressRequest } from '../../models/egress/egress.model';

@Injectable({ providedIn: 'root' })
export class EgressService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Egresses`;

  list(): Observable<Egress[]> {
    return this.http.get<Egress[]>(this.url);
  }

  getById(id: string): Observable<Egress> {
    return this.http.get<Egress>(`${this.url}/${id}`);
  }

  create(request: EgressRequest): Observable<Egress> {
    return this.http.post<Egress>(`${this.url}/newEgress`, request);
  }

  update(id: string, request: EgressRequest): Observable<Egress> {
    return this.http.put<Egress>(`${this.url}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
