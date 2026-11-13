import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { PageHeader } from '../../shared/page-header';
import { EmptyState } from '../../shared/empty-state';
import { Purchase } from '../../../models/purchases/purchase.model';
import {
  ITEM_TYPES,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_TONES,
} from '../../../models/purchases/purchase-enums';
import { labelOf } from '../../../models/product/catalog-enums';
import { PurchaseService } from '../../../services/purchases/purchase.service';
import { PurchaseDialogs } from '../../../services/purchases/purchase-dialogs.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import {
  PROCESSOR_DELAY_MS,
  canCancel,
  canLinkExpense,
  canReceive,
  purchaseErrorMessage,
} from '../../../utils/purchases/form-rules';

@Component({
  selector: 'app-purchase-detail',
  imports: [RouterLink, DatePipe, UpperCasePipe, PricePipe, PageHeader, EmptyState],
  templateUrl: './purchase-detail.html',
})
export class PurchaseDetail {
  private readonly purchaseService = inject(PurchaseService);
  private readonly dialogs = inject(PurchaseDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // Llega desde la ruta /compras/:id (withComponentInputBinding).
  readonly id = input.required<string>();

  protected readonly purchase = signal<Purchase | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);
  private readonly refresh = signal(0);
  private readonly busyAction = signal(false);
  protected readonly busy = this.busyAction.asReadonly();

  protected readonly statuses = PURCHASE_STATUSES;
  protected readonly tones = PURCHASE_STATUS_TONES;
  protected readonly itemTypes = ITEM_TYPES;
  protected readonly labelOf = labelOf;

  protected readonly receivable = computed(() => {
    const purchase = this.purchase();
    return purchase !== null && this.session.isAdmin() && canReceive(purchase);
  });
  protected readonly cancellable = computed(() => {
    const purchase = this.purchase();
    return purchase !== null && this.session.isAdmin() && canCancel(purchase);
  });
  protected readonly linkable = computed(() => {
    const purchase = this.purchase();
    return purchase !== null && this.session.isAdmin() && canLinkExpense(purchase);
  });

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const id = this.id();
      this.error.set(null);
      this.notFound.set(false);
      const subscription = this.purchaseService.getById(id).subscribe({
        next: (purchase) => {
          this.purchase.set(purchase);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.purchase.set(null);
          this.loading.set(false);
          if (error.status === 404 || error.status === 400) {
            this.notFound.set(true);
          } else {
            this.error.set(purchaseErrorMessage(error, 'No se pudo cargar la compra'));
          }
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected reload(): void {
    this.refresh.update((value) => value + 1);
  }

  protected receive(purchase: Purchase): void {
    this.busyAction.set(true);
    this.purchaseService.receive(purchase.id).subscribe({
      next: () => {
        this.busyAction.set(false);
        this.toast.success(`La compra ${purchase.purchaseNumber} se marcó como recibida`);
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.busyAction.set(false);
        this.toast.error(purchaseErrorMessage(error, 'No se pudo recibir la compra'));
      },
    });
  }

  protected cancel(purchase: Purchase): void {
    this.confirm(
      'Cancelar la compra',
      `La compra ${purchase.purchaseNumber} quedará cancelada y no se podrá recibir ni vincular a un egreso.`,
      'Cancelar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busyAction.set(true);
      this.purchaseService.cancel(purchase.id).subscribe({
        next: () => {
          this.busyAction.set(false);
          this.toast.info(
            `La cancelación de ${purchase.purchaseNumber} se envió; el procesador la confirma en un momento`,
          );
          setTimeout(() => this.reload(), PROCESSOR_DELAY_MS);
        },
        error: (error: HttpErrorResponse) => {
          this.busyAction.set(false);
          this.toast.error(purchaseErrorMessage(error, 'No se pudo cancelar la compra'));
        },
      });
    });
  }

  protected linkExpense(purchase: Purchase): void {
    this.dialogs.linkExpense(purchase).subscribe(() => {
      this.toast.success(`La compra ${purchase.purchaseNumber} se vinculó al egreso`);
      this.reload();
    });
  }
}
