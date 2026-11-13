import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Service, ServiceFilters } from '../../models/product/service.model';
import { toHttpParams } from '../../utils/shared/http-params';
import { MERGE_PATCH_JSON } from '../../utils/product/form-rules';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/services`;

  list(filters: ServiceFilters = {}): Observable<Service[]> {
    return this.http.get<Service[]>(this.url, { params: toHttpParams(filters) });
  }

  getById(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.url}/${id}`);
  }

  create(service: Service): Observable<Service> {
    return this.http.post<Service>(this.url, service);
  }

  patch(id: string, changes: Partial<Service>): Observable<Service> {
    return this.http.patch<Service>(`${this.url}/${id}`, changes, {
      headers: { 'Content-Type': MERGE_PATCH_JSON },
    });
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
