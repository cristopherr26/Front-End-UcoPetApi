
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Receipt,
  ReceiptAccepted,
  ReceiptRequest,
  ReceiptState,
} from '../../models/receipts/receipt.model';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/receipts`;

  /**
   * Obtiene todos los recibos.
   */
  list(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(this.url);
  }

  /**
   * Obtiene un recibo por su identificador.
   */
  getById(id: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.url}/${id}`);
  }

  /**
   * Filtra recibos por tutor y/o estado.
   * El backend admite únicamente estos dos filtros.
   */
  filter(filters: {
    tutorId?: string;
    state?: ReceiptState;
  }): Observable<Receipt[]> {
    let params = new HttpParams();

    if (filters.tutorId) {
      params = params.set('tutorId', filters.tutorId);
    }

    if (filters.state) {
      params = params.set('state', filters.state);
    }

    return this.http.get<Receipt[]>(`${this.url}/filter`, { params });
  }

  /**
   * Envía un recibo para su creación.
   * La API responde HTTP 202 Accepted.
   */
  create(request: ReceiptRequest): Observable<ReceiptAccepted> {
    return this.http.post<ReceiptAccepted>(this.url, request);
  }

  /**
   * Envía un recibo para su actualización.
   * La API responde HTTP 202 Accepted.
   */
  update(
    id: string,
    request: ReceiptRequest,
  ): Observable<ReceiptAccepted> {
    return this.http.put<ReceiptAccepted>(
      `${this.url}/${id}`,
      request,
    );
  }

  /**
   * Envía un recibo para su anulación.
   * La API responde HTTP 202 Accepted.
   */
  cancel(id: string): Observable<ReceiptAccepted> {
    return this.http.put<ReceiptAccepted>(
      `${this.url}/${id}/cancel`,
      null,
    );
  }
}
