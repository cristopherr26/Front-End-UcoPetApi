
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PayMethod } from '../../models/receipts/receipt.model';

@Injectable({ providedIn: 'root' })
export class PayMethodService {
  private readonly http = inject(HttpClient);

  private cache: Observable<PayMethod[]> | null = null;

  /**
   * Obtiene los métodos de pago disponibles.
   * Comparte la respuesta entre los componentes que utilicen el servicio
   * para evitar solicitudes HTTP innecesarias.
   */
  list(): Observable<PayMethod[]> {
    if (this.cache === null) {
      this.cache = this.http
        .get<PayMethod[]>(`${environment.apiUrl}/PayMethods`)
        .pipe(
          tap({
            error: () => {
              this.cache = null;
            },
          }),
          shareReplay(1),
        );
    }

    return this.cache;
  }
}
