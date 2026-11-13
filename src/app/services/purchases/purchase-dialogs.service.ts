import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Purchase } from '../../models/purchases/purchase.model';
import { PurchaseForm } from '../../components/purchases/purchase-form/purchase-form';
import { LinkExpenseModal } from '../../components/purchases/link-expense-modal/link-expense-modal';

// Abre los modales de Compras. Si el usuario cierra sin guardar, el observable termina sin emitir.
@Injectable({ providedIn: 'root' })
export class PurchaseDialogs {
  private readonly modalService = inject(NgbModal);

  create(): Observable<Purchase> {
    const ref = this.modalService.open(PurchaseForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    return from(ref.result as Promise<Purchase>).pipe(catchError(() => EMPTY));
  }

  linkExpense(purchase: Purchase): Observable<Purchase> {
    const ref = this.modalService.open(LinkExpenseModal, { backdrop: 'static' });
    ref.componentInstance.start(purchase);
    return from(ref.result as Promise<Purchase>).pipe(catchError(() => EMPTY));
  }
}
