import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Doctor } from '../../models/doctor/doctor.model';
import { SpecialtieDoctor } from '../../models/doctor/specialtie-doctor.model';
import { DoctorForm } from '../../components/doctor/doctor-form/doctor-form';
import { SpecialtieDoctorForm } from '../../components/doctor/specialtie-doctor-form/specialtie-doctor-form';

@Injectable({ providedIn: 'root' })
export class DoctorDialogs {
  private readonly modalService = inject(NgbModal);

  doctor(doctor: Doctor | null = null): Observable<Doctor> {
    const ref = this.modalService.open(DoctorForm, { backdrop: 'static', scrollable: true });
    if (doctor) {
      ref.componentInstance.edit(doctor);
    }
    return from(ref.result as Promise<Doctor>).pipe(catchError(() => EMPTY));
  }

  specialtieDoctor(
    relation: SpecialtieDoctor | null = null,
    presetDoctorId: string | null = null,
  ): Observable<SpecialtieDoctor> {
    const ref = this.modalService.open(SpecialtieDoctorForm, {
      backdrop: 'static',
      scrollable: true,
    });
    if (relation) {
      ref.componentInstance.edit(relation);
    } else if (presetDoctorId) {
      ref.componentInstance.presetDoctor(presetDoctorId);
    }
    return from(ref.result as Promise<SpecialtieDoctor>).pipe(catchError(() => EMPTY));
  }
}