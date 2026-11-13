import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { EgressForm } from '../../components/egress/egress-form/egress-form';
import { Egress, EgressCatalog, EgressView } from '../../models/egress/egress.model';
import { injectConfirm } from '../shared/confirm';

@Injectable({ providedIn: 'root' })
export class EgressDialogsService {
  private readonly modalService = inject(NgbModal);
  private readonly confirm = injectConfirm();

  openForm(catalog: EgressCatalog, egress: EgressView | null): Observable<Egress> {
    const ref = this.modalService.open(EgressForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    (ref.componentInstance as EgressForm).start(catalog, egress);
    return from(ref.result as Promise<Egress>).pipe(catchError(() => EMPTY));
  }

  confirmDelete(egress: EgressView): Observable<boolean> {
    return this.confirm(
      'Eliminar el egreso',
      `Se eliminará "${egress.concept}" (${egress.purchaseNumber}). Su valor vuelve al saldo pendiente de la orden.`,
      'Eliminar',
    );
  }
}
