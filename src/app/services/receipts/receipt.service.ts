import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Receipt, ReceiptAccepted, ReceiptRequest } from '../../models/receipts/receipt.model';

/**
 * Crear, editar y anular responden 202: la API solo encola el mensaje y el
 * procesador de pagos guarda el recibo un instante después.
 */
@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/receipts`;

  list(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(this.url);
  }

  create(request: ReceiptRequest): Observable<ReceiptAccepted> {
    return this.http.post<ReceiptAccepted>(this.url, request);
  }

  update(id: string, request: ReceiptRequest): Observable<ReceiptAccepted> {
    return this.http.put<ReceiptAccepted>(`${this.url}/${id}`, request);
  }

  cancel(id: string): Observable<ReceiptAccepted> {
    return this.http.put<ReceiptAccepted>(`${this.url}/${id}/cancel`, null);
  }
}
