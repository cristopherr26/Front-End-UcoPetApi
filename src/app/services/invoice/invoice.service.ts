import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoiceAccepted,
  InvoiceFilters,
  RegisterPaymentRequest,
} from '../../models/invoice/invoice.model';
import { toHttpParams } from '../../utils/shared/http-params';

// Facturas está en /api/invoices (sin /v1), por eso usa apiBase y no apiUrl.
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBase}/invoices`;

  list(filters: InvoiceFilters = {}): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.url, { params: toHttpParams(filters) });
  }

  getById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.url}/${id}`);
  }

  // Las tres escrituras responden 202: el procesador de pagos aplica el cambio después.
  create(request: CreateInvoiceRequest): Observable<InvoiceAccepted> {
    return this.http.post<InvoiceAccepted>(this.url, request);
  }

  registerPayment(id: string, payment: RegisterPaymentRequest): Observable<InvoiceAccepted> {
    return this.http.put<InvoiceAccepted>(`${this.url}/${id}/payments`, payment);
  }

  cancel(id: string): Observable<InvoiceAccepted> {
    return this.http.put<InvoiceAccepted>(`${this.url}/${id}/cancel`, null);
  }
}
