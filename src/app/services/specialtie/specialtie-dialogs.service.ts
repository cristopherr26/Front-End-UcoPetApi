import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, catchError, from } from 'rxjs';

import { Specialtie } from '../../models/specialtie/specialtie.model';
import { SpecialtieDoctor } from '../../models/specialtie/specialtie-doctor.model';
import { SpecialtieForm } from '../../components/specialtie/specialtie-form/specialtie-form';
import { SpecialtieDoctorForm } from '../../components/specialtie/specialtie-doctor-form/specialtie-doctor-form';
import { SpecialtieRejectForm } from '../../components/specialtie/specialtie-reject-form/specialtie-reject-form';

// Cada diálogo emite el resultado guardado, o nada (EMPTY) si se cancela
@Injectable({ providedIn: 'root' })
export class SpecialtieDialogs {
  private readonly modalService = inject(NgbModal);

  // Crear o editar una especialidad del catálogo
  specialtie(specialtie: Specialtie | null = null): Observable<Specialtie> {
    const ref = this.modalService.open(SpecialtieForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    if (specialtie) {
      ref.componentInstance.edit(specialtie);
    }
    return from(ref.result as Promise<Specialtie>).pipe(catchError(() => EMPTY));
  }

  // Crear o editar una asignación; se recibe el objeto completo (no el id)
  specialtieDoctor(
    relation: SpecialtieDoctor | null = null,
    presetDoctorId: string | null = null,
  ): Observable<SpecialtieDoctor> {
    const ref = this.modalService.open(SpecialtieDoctorForm, {
      size: 'lg',
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

  // Rechazar una asignación PENDING con un motivo obligatorio
  reject(
    relation: SpecialtieDoctor,
    doctorName: string,
    specialtieName: string,
  ): Observable<SpecialtieDoctor> {
    const ref = this.modalService.open(SpecialtieRejectForm, {
      size: 'lg',
      backdrop: 'static',
    });
    ref.componentInstance.setRelation(relation, doctorName, specialtieName);
    return from(ref.result as Promise<SpecialtieDoctor>).pipe(catchError(() => EMPTY));
  }
}
