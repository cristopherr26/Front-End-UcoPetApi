import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
    EMPTY,
    Observable,
    catchError,
    from
} from 'rxjs';

import {
    Procedure,
    ProcedureActionResponse
} from '../../models/procedure/procedure.model';
import { ProcedureForm } from '../../components/procedure/procedure-form/procedure-form';

@Injectable({
    providedIn: 'root'
})
export class ProcedureDialogs {

    private readonly modalService = inject(NgbModal);

    procedure(procedure: Procedure | null = null): Observable<ProcedureActionResponse> {

    const ref = this.modalService.open(ProcedureForm, {
        size: 'lg',
        backdrop: 'static',
        scrollable: true
    });

    if (procedure !== null) {
        ref.componentInstance.edit(procedure);
    }

    return from(ref.result as Promise<ProcedureActionResponse>).pipe(
        catchError(() => EMPTY)
    );

    }

}