import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { Product } from '../../../models/product/product.model';
import {
  INCOMING_REASONS,
  OUTGOING_REASONS,
  STOCK_MOVEMENT_REASONS,
  StockMovementReason,
} from '../../../models/product/catalog-enums';
import { StockService } from '../../../services/product/stock.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { blankToNull } from '../../../utils/product/form-rules';

type Direction = 'IN' | 'OUT';

@Component({
  selector: 'app-stock-adjust',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './stock-adjust.html',
})
export class StockAdjust implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    headquarterId: this.fb.control<string | null>(null, Validators.required),
    direction: this.fb.control<Direction>('IN'),
    quantity: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    reason: this.fb.control<StockMovementReason>('PURCHASE', Validators.required),
    note: ['', Validators.maxLength(255)],
  });
  protected readonly product = signal<Product | null>(null);
  protected readonly headquarters = signal<Headquarter[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly direction = toSignal(this.form.controls.direction.valueChanges, {
    initialValue: 'IN' as Direction,
  });

  protected readonly reasons = computed(() => {
    const allowed = this.direction() === 'IN' ? INCOMING_REASONS : OUTGOING_REASONS;
    return STOCK_MOVEMENT_REASONS.filter((option) => allowed.includes(option.value));
  });

  constructor() {
    this.form.controls.direction.valueChanges.subscribe((direction) =>
      this.form.controls.reason.setValue(direction === 'IN' ? 'PURCHASE' : 'SALE'),
    );
  }

  ngOnInit(): void {
    this.headquarterService
      .list()
      .subscribe((headquarters) =>
        this.headquarters.set(
          headquarters
            .filter((headquarter) => headquarter.isActive)
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
      );
  }

  start(product: Product, headquarterId: string | null): void {
    this.product.set(product);
    this.form.controls.headquarterId.setValue(headquarterId);
  }

  protected setDirection(direction: Direction): void {
    this.form.controls.direction.setValue(direction);
  }

  protected save(): void {
    const product = this.product();
    if (this.form.invalid || !product?.id) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const quantity = Number(value.quantity);
    this.saving.set(true);
    this.error.set(null);
    this.stockService
      .adjust({
        productId: product.id,
        headquarterId: value.headquarterId as string,
        quantity: value.direction === 'IN' ? quantity : -quantity,
        reason: value.reason,
        note: blankToNull(value.note),
      })
      .subscribe({
        next: (stock) => this.modal.close(stock),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudo registrar el movimiento'));
        },
      });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
