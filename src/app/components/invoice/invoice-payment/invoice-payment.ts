import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Invoice } from '../../../models/invoice/invoice.model';
import { InvoiceService } from '../../../services/invoice/invoice.service';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { invoiceErrorMessage, paymentAmountRules } from '../../../utils/invoice/form-rules';

@Component({
  selector: 'app-invoice-payment',
  imports: [ReactiveFormsModule, PricePipe, ModalFrame],
  templateUrl: './invoice-payment.html',
})
export class InvoicePayment {
  private readonly invoiceService = inject(InvoiceService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly invoice = signal<Invoice | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null),
  });

  private readonly amount = toSignal(this.form.controls.amount.valueChanges, {
    initialValue: null,
  });
  protected readonly balanceAfter = computed(() => {
    const invoice = this.invoice();
    const amount = Number(this.amount() ?? 0);
    return invoice ? Math.max(0, invoice.balance - (Number.isNaN(amount) ? 0 : amount)) : null;
  });

  // La abre InvoiceDialogs con la factura sobre la que se abona.
  start(invoice: Invoice): void {
    this.invoice.set(invoice);
    this.form.controls.amount.setValidators(paymentAmountRules(invoice.balance));
    this.form.controls.amount.updateValueAndValidity();
  }

  protected payAll(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.form.controls.amount.setValue(invoice.balance);
      this.form.controls.amount.markAsTouched();
    }
  }

  protected save(): void {
    const invoice = this.invoice();
    if (!invoice || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.invoiceService
      .registerPayment(invoice.id, { amount: Number(this.form.controls.amount.value) })
      .subscribe({
        next: (accepted) => this.modal.close(accepted),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(invoiceErrorMessage(error, 'No se pudo registrar el pago'));
        },
      });
  }

  protected invalid(): boolean {
    const control = this.form.controls.amount;
    return control.touched && control.invalid;
  }

  protected hasError(code: string): boolean {
    return this.form.controls.amount.hasError(code);
  }
}
