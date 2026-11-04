import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { HeadquarterPayload } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { NAME_RULES } from '../../../utils/product/form-rules';

@Component({
  selector: 'app-headquarter-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './headquarter-form.html',
})
export class HeadquarterForm {
  private readonly headquarterService = inject(HeadquarterService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    name: ['', [...NAME_RULES, Validators.minLength(3), Validators.maxLength(50)]],
    address: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  });
  protected readonly headquarterId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private isActive = true;

  edit(id: string): void {
    this.headquarterId.set(id);
    this.loading.set(true);
    this.headquarterService.getById(id).subscribe({
      next: (headquarter) => {
        this.isActive = headquarter.isActive;
        this.form.patchValue({ name: headquarter.name, address: headquarter.address });
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se encontró la sede'));
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: HeadquarterPayload = {
      name: value.name.trim(),
      address: value.address.trim(),
      isActive: this.isActive,
    };
    const id = this.headquarterId();
    this.saving.set(true);
    this.error.set(null);
    (id
      ? this.headquarterService.update(id, payload)
      : this.headquarterService.create(payload)
    ).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar la sede'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
