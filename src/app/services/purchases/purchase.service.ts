import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreatePurchaseRequest,
  LinkExpenseRequest,
  Purchase,
  PurchaseFilters,
  PurchasePage,
  PurchaseSupplierOption,
} from '../../models/purchases/purchase.model';
import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/purchases`;

  list(filters: PurchaseFilters): Observable<PurchasePage> {
    return this.http.get<PurchasePage>(this.url, { params: toHttpParams(filters) });
  }

  getById(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.url}/${id}`);
  }

  // El POST responde 201 de inmediato, pero quien persiste de verdad es el
  // consumer de RabbitMQ en ucopet-commercial-processor: justo después de crear,
  // un GET puede responder 404 por un instante hasta que el mensaje se procesa.
  create(request: CreatePurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(this.url, request);
  }

  receive(id: string): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.url}/${id}/receive`, null);
  }

  // Igual que create: se publica por RabbitMQ y el cambio de estado lo aplica el consumer.
  cancel(id: string): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.url}/${id}/cancel`, null);
  }

  linkExpense(id: string, request: LinkExpenseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.url}/${id}/link-expense`, request);
  }

  // Solo lo que el formulario de compra necesita para el desplegable de proveedor.
  // Lectura directa a GET /api/v1/providers; no depende del módulo "provider".
  listSuppliers(): Observable<PurchaseSupplierOption[]> {
    return this.http.get<PurchaseSupplierOption[]>(`${environment.apiUrl}/providers`);
  }
}
