import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AppointmentType } from '../../../models/appointment/appointment-type.model';
import { AppointmentTypeService } from '../../../services/appointment/appointment-type.service';
import { appointmentErrorMessage } from '../../../utils/appointment/appointment-errors';
import { TYPE_DESCRIPTION_RULES, TYPE_NAME_RULES } from '../../../utils/appointment/form-rules';
import { ModalFrame } from '../../shared/modal-frame';

@Component({
  selector: 'app-appointment-type-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './appointment-type-form.html',
})
export class AppointmentTypeForm {
  private readonly typeService = inject(AppointmentTypeService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    name: ['', TYPE_NAME_RULES],
    description: ['', TYPE_DESCRIPTION_RULES],
    isActive: [true],
  });
  protected readonly typeId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  edit(type: AppointmentType): void {
    this.typeId.set(type.id ?? null);
    this.form.patchValue({
      name: type.name,
      description: type.description ?? '',
      isActive: type.isActive,
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const type: AppointmentType = {
      name: value.name.trim(),
      description: value.description.trim(),
      isActive: value.isActive,
    };
    const id = this.typeId();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.typeService.update(id, type) : this.typeService.create(type)).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(appointmentErrorMessage(error, 'No se pudo guardar el tipo de cita'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
