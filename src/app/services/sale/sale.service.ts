import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { toHttpParams } from '../../utils/shared/http-params';
import {
  AddSaleItemRequest,
  EditSaleItemRequest,
  SaleItem,
  SaleOrder,
  SaleOrderFilters,
  SaleOrderRequest,
} from '../../models/sale/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/sales`;

  list(filters: SaleOrderFilters = {}): Observable<SaleOrder[]> {
    return this.http.get<SaleOrder[]>(this.url, { params: toHttpParams(filters) });
  }

  create(request: SaleOrderRequest): Observable<SaleOrder> {
    return this.http.post<SaleOrder>(this.url, request);
  }

  update(id: string, request: SaleOrderRequest): Observable<SaleOrder> {
    return this.http.put<SaleOrder>(`${this.url}/${id}`, request);
  }

  cancel(id: string): Observable<SaleOrder> {
    return this.http.put<SaleOrder>(`${this.url}/${id}/cancel`, {});
  }

  listItems(orderId: string): Observable<SaleItem[]> {
    return this.http.get<SaleItem[]>(`${this.url}/${orderId}/items`);
  }

  addItem(orderId: string, request: AddSaleItemRequest): Observable<SaleOrder> {
    return this.http.post<SaleOrder>(`${this.url}/${orderId}/items`, request);
  }

  editItem(orderId: string, itemId: string, request: EditSaleItemRequest): Observable<SaleOrder> {
    return this.http.put<SaleOrder>(`${this.url}/${orderId}/items/${itemId}`, request);
  }

  removeItem(orderId: string, itemId: string): Observable<SaleOrder> {
    return this.http.delete<SaleOrder>(`${this.url}/${orderId}/items/${itemId}`);
  }
}
