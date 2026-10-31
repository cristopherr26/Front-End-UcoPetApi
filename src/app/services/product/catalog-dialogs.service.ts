import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Product } from '../../models/product/product.model';
import { Service } from '../../models/product/service.model';
import { Stock } from '../../models/product/stock.model';
import { ProductForm } from '../../components/product/product-form/product-form';
import { ServiceForm } from '../../components/product/service-form/service-form';
import { StockAdjust } from '../../components/product/stock-adjust/stock-adjust';

@Injectable({ providedIn: 'root' })
export class CatalogDialogs {
  private readonly modalService = inject(NgbModal);

  product(id: string | null = null): Observable<Product> {
    const ref = this.modalService.open(ProductForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (id) {
      ref.componentInstance.edit(id);
    }
    return from(ref.result as Promise<Product>).pipe(catchError(() => EMPTY));
  }

  service(id: string | null = null): Observable<Service> {
    const ref = this.modalService.open(ServiceForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (id) {
      ref.componentInstance.edit(id);
    }
    return from(ref.result as Promise<Service>).pipe(catchError(() => EMPTY));
  }

  adjustStock(product: Product, headquarterId: string | null): Observable<Stock> {
    const ref = this.modalService.open(StockAdjust, { backdrop: 'static' });
    ref.componentInstance.start(product, headquarterId);
    return from(ref.result as Promise<Stock>).pipe(catchError(() => EMPTY));
  }
}
