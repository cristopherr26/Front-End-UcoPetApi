import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { SpecialtieDoctor } from '../../../models/specialtie/specialtie-doctor.model';
import { SpecialtieDoctorService } from '../../../services/specialtie/specialtie-doctor.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { REJECTION_MAX, requiredTextRule } from '../../../utils/specialtie/form-rules';

@Component({
  selector: 'app-specialtie-reject-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './specialtie-reject-form.html',
})
export class SpecialtieRejectForm {
  private readonly relationService = inject(SpecialtieDoctorService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly reasonMax = REJECTION_MAX;

  protected readonly form = this.fb.group({
    reason: ['', [requiredTextRule, Validators.maxLength(REJECTION_MAX)]],
  });

  protected readonly relation = signal<SpecialtieDoctor | null>(null);
  protected readonly doctorName = signal('');
  protected readonly specialtieName = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly reasonLength = toSignal(
    this.form.controls.reason.valueChanges.pipe(map((value) => value.length)),
    { initialValue: 0 },
  );

  setRelation(relation: SpecialtieDoctor, doctorName: string, specialtieName: string): void {
    this.relation.set(relation);
    this.doctorName.set(doctorName);
    this.specialtieName.set(specialtieName);
  }

  protected save(): void {
    const relation = this.relation();
    if (this.form.invalid || relation === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.relationService.reject(relation.id, this.form.getRawValue().reason.trim()).subscribe({
      next: (updated) => this.modal.close(updated),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo rechazar la asignación'));
      },
    });
  }

  protected invalid(): boolean {
    const control = this.form.controls.reason;
    return control.touched && control.invalid;
  }
}
