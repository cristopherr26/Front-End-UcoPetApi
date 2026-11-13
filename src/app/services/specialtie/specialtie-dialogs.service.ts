import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { SpecialtieDoctor } from '../../models/doctor/specialtie-doctor.model';
import { SpecialtieDoctorForm } from '../../components/doctor/specialtie-doctor-form/specialtie-doctor-form';

@Injectable({ providedIn: 'root' })
export class SpecialtieDialogs {
  private readonly modalService = inject(NgbModal);

  specialtieDoctor(id: string | null = null): Observable<SpecialtieDoctor> {
    const ref = this.modalService.open(SpecialtieDoctorForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (id) {
      ref.componentInstance.edit(id);
    }
    return from(ref.result as Promise<SpecialtieDoctor>).pipe(catchError(() => EMPTY));
  }
}