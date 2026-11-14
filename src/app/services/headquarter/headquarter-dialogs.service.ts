import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Headquarter } from '../../models/headquarter/headquarter.model';
import { HeadquarterForm } from '../../components/headquarter/headquarter-form/headquarter-form';

@Injectable({ providedIn: 'root' })
export class HeadquarterDialogs {
  private readonly modalService = inject(NgbModal);

  headquarter(id: string | null = null): Observable<Headquarter> {
    const ref = this.modalService.open(HeadquarterForm, { backdrop: 'static' });
    if (id) {
      ref.componentInstance.edit(id);
    }
    return from(ref.result as Promise<Headquarter>).pipe(catchError(() => EMPTY));
  }
}
