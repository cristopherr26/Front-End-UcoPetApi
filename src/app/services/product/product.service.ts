import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Product, ProductFilters } from '../../models/product/product.model';
import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/products`;

  list(filters: ProductFilters = {}): Observable<Product[]> {
    return this.http.get<Product[]>(this.url, { params: toHttpParams(filters) });
  }

  getById(id: string, headquarterId: string | null = null): Observable<Product> {
    const params = headquarterId ? new HttpParams().set('headquarterId', headquarterId) : undefined;
    return this.http.get<Product>(`${this.url}/${id}`, { params });
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.url, product);
  }

  update(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, product);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
