import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { BillableSaleOrder } from '../../../models/invoice/billable-sale-order.model';
import { InvoiceService } from '../../../services/invoice/invoice.service';
import { InvoiceReferenceService } from '../../../services/invoice/invoice-reference.service';
import { SessionService } from '../../../services/session/session.service';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import {
  OBSERVATIONS_MAX,
  blankToNull,
  invoiceErrorMessage,
} from '../../../utils/invoice/form-rules';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, DatePipe, PricePipe, ModalFrame],
  templateUrl: './invoice-form.html',
})
export class InvoiceForm {
  private readonly invoiceService = inject(InvoiceService);
  private readonly references = inject(InvoiceReferenceService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly observationsMax = OBSERVATIONS_MAX;
  protected readonly form = this.fb.group({
    saleOrderId: this.fb.control<string | null>(null, Validators.required),
    observations: ['', Validators.maxLength(OBSERVATIONS_MAX)],
  });

  protected readonly orders = signal<BillableSaleOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly selectedId = toSignal(this.form.controls.saleOrderId.valueChanges, {
    initialValue: null,
  });
  protected readonly selected = computed(
    () => this.orders().find((order) => order.id === this.selectedId()) ?? null,
  );
  private readonly observations = toSignal(this.form.controls.observations.valueChanges, {
    initialValue: '',
  });
  protected readonly observationsLength = computed(() => this.observations().length);

  constructor() {
    this.references.billableSaleOrders(this.session.headquarterId()).subscribe({
      next: (orders) => {
        this.orders.set([...orders].sort((a, b) => b.saleDate.localeCompare(a.saleDate)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(invoiceErrorMessage(error, 'No se pudieron cargar las órdenes de venta'));
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.invoiceService
      .create({
        saleOrderId: value.saleOrderId as string,
        observations: blankToNull(value.observations),
      })
      .subscribe({
        next: (accepted) => this.modal.close(accepted),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(invoiceErrorMessage(error, 'No se pudo enviar la factura'));
        },
      });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
