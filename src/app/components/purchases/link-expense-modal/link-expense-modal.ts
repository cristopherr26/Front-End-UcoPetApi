import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Purchase } from '../../../models/purchases/purchase.model';
import { PurchaseService } from '../../../services/purchases/purchase.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El módulo de Egresos todavía no existe (solo .gitkeep), así que por ahora el id
// del egreso ya generado se ingresa a mano en vez de elegirlo de una lista.
@Component({
  selector: 'app-link-expense-modal',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './link-expense-modal.html',
})
export class LinkExpenseModal {
  private readonly purchaseService = inject(PurchaseService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  private purchase: Purchase | null = null;

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    expenseId: ['', [Validators.required, Validators.pattern(UUID_PATTERN)]],
  });

  start(purchase: Purchase): void {
    this.purchase = purchase;
  }

  protected invalid(): boolean {
    return this.form.controls.expenseId.touched && this.form.controls.expenseId.invalid;
  }

  protected save(): void {
    if (this.form.invalid || this.purchase === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.purchaseService
      .linkExpense(this.purchase.id, { expenseId: this.form.getRawValue().expenseId })
      .subscribe({
        next: (response) => this.modal.close(response),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudo vincular el egreso'));
        },
      });
  }
}
