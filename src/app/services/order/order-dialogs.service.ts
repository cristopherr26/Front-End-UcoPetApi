import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Order } from '../../models/order/order.model';
import { OrderForm } from '../../components/order/order-form/order-form';
import { OrderProcedureForm } from '../../components/order/order-procedure-form/order-procedure-form';

@Injectable({
  providedIn: 'root',
})
export class OrderDialogs {
  private readonly modalService = inject(NgbModal);

  // Crear una orden; emite la orden creada (201) o nada si se cancela
  order(): Observable<Order> {
    const ref = this.modalService.open(OrderForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });

    return from(ref.result as Promise<Order>).pipe(catchError(() => EMPTY));
  }

  // Cambiar el procedimiento de una orden PENDING; emite la orden actualizada
  procedure(order: Order): Observable<Order> {
    const ref = this.modalService.open(OrderProcedureForm, {
      backdrop: 'static',
    });

    ref.componentInstance.edit(order);

    return from(ref.result as Promise<Order>).pipe(catchError(() => EMPTY));
  }
}
