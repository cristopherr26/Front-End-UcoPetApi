import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../shared/modal-frame';

@Component({
  selector: 'app-example-modal',
  imports: [ReactiveFormsModule, ModalFrame],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <app-modal-frame
        title="Nuevo registro"
        subtitle="Ejemplo del patrón de formulario en modal"
        icon="bi-plus-square"
        (closed)="modal.dismiss()"
      >
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="example-name">Nombre *</label>
            <input
              id="example-name"
              class="form-control"
              formControlName="name"
              [class.is-invalid]="form.controls.name.touched && form.controls.name.invalid"
            />
            <div class="invalid-feedback">El nombre es obligatorio</div>
          </div>
          <div class="col-12">
            <label class="form-label" for="example-note"
              >Nota <span class="text-body-secondary fw-semibold small">opcional</span></label
            >
            <textarea
              id="example-note"
              class="form-control"
              rows="2"
              formControlName="note"
            ></textarea>
          </div>
        </div>
        <ng-container modalFooter>
          <button type="button" class="btn btn-light" (click)="modal.dismiss()">Cancelar</button>
          <button type="submit" class="btn btn-primary">
            <i class="bi bi-check2 me-1"></i>Guardar
          </button>
        </ng-container>
      </app-modal-frame>
    </form>
  `,
})
export class ExampleModal {
  protected readonly modal = inject(NgbActiveModal);
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    note: [''],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.modal.close(this.form.getRawValue().name);
  }
}
