import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { Specialtie, UpdateSpecialtieRequest } from '../../../models/specialtie/specialtie.model';
import { SpecialtieService } from '../../../services/specialtie/specialtie.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  specialtieDescriptionRule,
  specialtieNameRule,
} from '../../../utils/specialtie/form-rules';

@Component({
  selector: 'app-specialtie-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './specialtie-form.html',
})
export class SpecialtieForm {
  private readonly specialtieService = inject(SpecialtieService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly descriptionMin = DESCRIPTION_MIN;
  protected readonly descriptionMax = DESCRIPTION_MAX;

  protected readonly form = this.fb.group({
    name: ['', specialtieNameRule],
    description: ['', specialtieDescriptionRule],
    active: [true],
  });

  // Especialidad en edición (null al crear)
  protected readonly current = signal<Specialtie | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  // Contador de caracteres de la descripción
  protected readonly descriptionLength = toSignal(
    this.form.controls.description.valueChanges.pipe(map((value) => value.trim().length)),
    { initialValue: 0 },
  );

  edit(specialtie: Specialtie): void {
    this.current.set(specialtie);
    this.form.setValue({
      name: specialtie.name ?? '',
      description: specialtie.description ?? '',
      active: specialtie.active !== false,
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const name = value.name.trim().replace(/\s+/g, ' ');
    const description = value.description.trim();
    const current = this.current();

    let request$;
    if (current === null) {
      request$ = this.specialtieService.create({ name, description, active: value.active });
    } else {
      // PATCH parcial: solo lo que cambió
      const changes: UpdateSpecialtieRequest = {};
      if (name !== current.name) {
        changes.name = name;
      }
      if (description !== current.description) {
        changes.description = description;
      }
      if (value.active !== (current.active !== false)) {
        changes.active = value.active;
      }
      if (Object.keys(changes).length === 0) {
        this.modal.dismiss();
        return;
      }
      request$ = this.specialtieService.update(current.id, changes);
    }

    this.saving.set(true);
    this.error.set(null);
    request$.subscribe({
      next: () =>
        this.modal.close({
          id: current?.id ?? '',
          name,
          description,
          active: value.active,
        } satisfies Specialtie),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar la especialidad'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected hasError(field: keyof typeof this.form.controls, code: string): boolean {
    return this.form.controls[field].hasError(code);
  }
}
