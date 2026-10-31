import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CatalogFilters, CatalogItem } from '../../models/product/catalog-item.model';
import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/catalog`;

  list(filters: CatalogFilters = {}): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(this.url, { params: toHttpParams(filters) });
  }
}
