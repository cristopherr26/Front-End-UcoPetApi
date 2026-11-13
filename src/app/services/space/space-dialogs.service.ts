import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Space } from '../../models/space/space.model';
import { SpaceForm } from '../../components/space/space-form/space-form';

@Injectable({ providedIn: 'root' })
export class SpaceDialogs {
  private readonly modalService = inject(NgbModal);

 
  space(existing: Space | null = null): Observable<Space> {
    const ref = this.modalService.open(SpaceForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (existing) {
      ref.componentInstance.edit(existing);
    }
    return from(ref.result as Promise<Space>).pipe(catchError(() => EMPTY));
  }
}