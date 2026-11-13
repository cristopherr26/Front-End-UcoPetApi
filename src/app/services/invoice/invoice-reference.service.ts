import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BillableSaleOrder } from '../../models/invoice/billable-sale-order.model';
import { toHttpParams } from '../../utils/shared/http-params';

// Datos de otros módulos que necesita Facturas. Solo lectura.
@Injectable({ providedIn: 'root' })
export class InvoiceReferenceService {
  private readonly http = inject(HttpClient);

  // La API solo factura órdenes de venta en BORRADOR.
  billableSaleOrders(headquarterId: string | null): Observable<BillableSaleOrder[]> {
    return this.http.get<BillableSaleOrder[]>(`${environment.apiUrl}/sales`, {
      params: toHttpParams({ state: 'BORRADOR', headquarterId }),
    });
  }
}
