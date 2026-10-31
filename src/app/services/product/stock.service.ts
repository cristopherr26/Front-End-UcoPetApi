import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Stock, StockAdjustment, StockMovement } from '../../models/product/stock.model';
import { toHttpParams } from '../../utils/shared/http-params';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/stock`;

  findByProduct(productId: string): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.url}/${productId}`);
  }

  findMovements(
    productId: string,
    headquarterId: string | null = null,
  ): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.url}/${productId}/movements`, {
      params: toHttpParams({ headquarterId }),
    });
  }

  adjust(adjustment: StockAdjustment): Observable<Stock> {
    return this.http.post<Stock>(`${this.url}/adjust`, adjustment);
  }
}
