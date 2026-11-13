import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Invoice, InvoiceAccepted } from '../../models/invoice/invoice.model';
import { InvoiceForm } from '../../components/invoice/invoice-form/invoice-form';
import { InvoicePayment } from '../../components/invoice/invoice-payment/invoice-payment';

// Abre los modales de Facturas. Si el usuario cierra sin guardar, el observable termina sin emitir.
@Injectable({ providedIn: 'root' })
export class InvoiceDialogs {
  private readonly modalService = inject(NgbModal);

  create(): Observable<InvoiceAccepted> {
    const ref = this.modalService.open(InvoiceForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    return from(ref.result as Promise<InvoiceAccepted>).pipe(catchError(() => EMPTY));
  }

  registerPayment(invoice: Invoice): Observable<InvoiceAccepted> {
    const ref = this.modalService.open(InvoicePayment, { backdrop: 'static' });
    ref.componentInstance.start(invoice);
    return from(ref.result as Promise<InvoiceAccepted>).pipe(catchError(() => EMPTY));
  }
}
