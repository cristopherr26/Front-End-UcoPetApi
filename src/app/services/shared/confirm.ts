import { inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, from, map, catchError, of } from 'rxjs';

import { ConfirmDialog } from '../../components/shared/confirm-dialog';

export function injectConfirm(): (
  title: string,
  message: string,
  confirmLabel: string,
) => Observable<boolean> {
  const modalService = inject(NgbModal);
  return (title, message, confirmLabel) => {
    const ref = modalService.open(ConfirmDialog, { centered: true, size: 'sm' });
    ref.componentInstance.title.set(title);
    ref.componentInstance.message.set(message);
    ref.componentInstance.confirmLabel.set(confirmLabel);
    return from(ref.result).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  };
}
