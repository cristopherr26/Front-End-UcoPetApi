import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import {
  EgressCatalog,
  EgressRequest,
  EgressView,
  PurchaseOption,
} from '../../../models/egress/egress.model';
import { EgressService } from '../../../services/egress/egress.service';
import { egressErrorMessage } from '../../../utils/egress/egress-error';
import {
  CONCEPT_MAX,
  CONCEPT_RULES,
  TOTAL_RULES,
  bindPurchaseToProvider,
  notFutureDate,
  todayIso,
} from '../../../utils/egress/form-rules';
import { payablePurchases, purchaseBalance } from '../../../utils/egress/egress-summary';

@Component({
  selector: 'app-egress-form',
  imports: [ReactiveFormsModule, ModalFrame, PricePipe],
  templateUrl: './egress-form.html',
})
export class EgressForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly egressService = inject(EgressService);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly conceptMax = CONCEPT_MAX;
  protected readonly today = todayIso();

  protected readonly catalog = signal<EgressCatalog | null>(null);
  protected readonly egress = signal<EgressView | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    date: [todayIso(), [Validators.required, notFutureDate]],
    provider: ['', Validators.required],
    purchaseOrder: ['', Validators.required],
    payMethod: ['', Validators.required],
    concept: ['', CONCEPT_RULES],
    total: this.fb.control<number | null>(null, TOTAL_RULES),
  });

  // Los valores del formulario como signals, para que las listas dependientes se recalculen solas.
  private readonly providerId = toSignal(this.form.controls.provider.valueChanges, {
    initialValue: '',
  });
  private readonly purchaseId = toSignal(this.form.controls.purchaseOrder.valueChanges, {
    initialValue: '',
  });

  protected readonly providers = computed(() => {
    const current = this.egress()?.provider;
    return (this.catalog()?.providers ?? [])
      .filter((provider) => provider.active || provider.id === current)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly purchases = computed(() => {
    const catalog = this.catalog();
    const providerId = this.providerId();
    if (!catalog || providerId === '') {
      return [];
    }
    const egress = this.egress();
    return payablePurchases(
      catalog.purchases,
      catalog.egresses,
      providerId,
      egress ? { egressId: egress.id, purchaseId: egress.purchaseOrder } : null,
    );
  });

  protected readonly payMethods = computed(() => this.catalog()?.payMethods ?? []);

  protected readonly selectedBalance = computed(() => {
    const purchase = this.findPurchase(this.purchaseId());
    return purchase ? { purchase, ...this.balanceOf(purchase) } : null;
  });

  constructor() {
    const subscription = bindPurchaseToProvider(
      this.form.controls,
      (purchaseId) => this.findPurchase(purchaseId)?.providerId ?? null,
      (purchaseId) => {
        const purchase = this.findPurchase(purchaseId);
        return purchase ? this.balanceOf(purchase).pending : 0;
      },
    );
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  start(catalog: EgressCatalog, egress: EgressView | null): void {
    this.catalog.set(catalog);
    this.egress.set(egress);
    if (egress) {
      this.form.patchValue({
        date: egress.date,
        provider: egress.provider,
        purchaseOrder: egress.purchaseOrder,
        payMethod: egress.payMethod,
        concept: egress.concept,
        total: egress.total,
      });
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: EgressRequest = {
      date: value.date,
      provider: value.provider,
      purchaseOrder: value.purchaseOrder,
      payMethod: value.payMethod,
      concept: value.concept.trim(),
      total: value.total as number,
    };
    const egress = this.egress();
    this.saving.set(true);
    this.error.set(null);
    (egress
        ? this.egressService.update(egress.id, request)
        : this.egressService.create(request)
    ).subscribe({
      next: (accepted) => this.modal.close(accepted),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(egressErrorMessage(error, 'No se pudo enviar el egreso'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  private findPurchase(purchaseId: string): PurchaseOption | undefined {
    return this.catalog()?.purchases.find((purchase) => purchase.id === purchaseId);
  }

  private balanceOf(purchase: PurchaseOption) {
    return purchaseBalance(purchase, this.catalog()?.egresses ?? [], this.egress()?.id ?? null);
  }
}
