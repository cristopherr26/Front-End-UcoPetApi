import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { EmptyState } from '../../shared/empty-state';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { PayMethodIconPipe } from '../../../pipes/egress/pay-method-icon.pipe';
import { ToastService } from '../../../services/shared/toast.service';
import {
  EgressCatalog,
  PURCHASE_STATUS_LABELS,
  PurchaseStatus,
} from '../../../models/egress/egress.model';
import { EgressService } from '../../../services/egress/egress.service';
import { EgressViewService } from '../../../services/egress/egress-view.service';
import { EgressDialogsService } from '../../../services/egress/egress-dialogs.service';
import { egressErrorMessage } from '../../../utils/egress/egress-error';
import { purchaseBalance } from '../../../utils/egress/egress-summary';
import { REFRESH_DELAYS_MS } from '../../../utils/egress/form-rules';

@Component({
  selector: 'app-egress-detail',
  imports: [DatePipe, RouterLink, EmptyState, PricePipe, PayMethodIconPipe],
  templateUrl: './egress-detail.html',
  styleUrl: './egress-detail.scss',
})
export class EgressDetail implements OnInit {
  readonly id = input.required<string>();

  private readonly viewService = inject(EgressViewService);
  private readonly egressService = inject(EgressService);
  private readonly dialogs = inject(EgressDialogsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  protected readonly catalog = signal<EgressCatalog | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly processing = signal(false);

  protected readonly egress = computed(
    () => this.catalog()?.egresses.find((egress) => egress.id === this.id()) ?? null,
  );

  protected readonly purchase = computed(() => {
    const egress = this.egress();
    return egress
      ? (this.catalog()?.purchases.find((purchase) => purchase.id === egress.purchaseOrder) ?? null)
      : null;
  });

  protected readonly balance = computed(() => {
    const purchase = this.purchase();
    return purchase ? purchaseBalance(purchase, this.catalog()?.egresses ?? []) : null;
  });

  protected readonly paidPercent = computed(() => {
    const purchase = this.purchase();
    const balance = this.balance();
    if (!purchase || !balance || purchase.total <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((balance.paid / purchase.total) * 100));
  });

  protected readonly history = computed(() => {
    const egress = this.egress();
    if (!egress) {
      return [];
    }
    return (this.catalog()?.egresses ?? [])
      .filter((other) => other.purchaseOrder === egress.purchaseOrder)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  ngOnInit(): void {
    this.load(false);
  }

  protected longDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(
      new Date(year, month - 1, day),
    );
  }

  protected statusLabel(status: PurchaseStatus): string {
    return PURCHASE_STATUS_LABELS[status] ?? status;
  }

  protected edit(): void {
    const catalog = this.catalog();
    const egress = this.egress();
    if (!catalog || !egress) {
      return;
    }
    this.dialogs.openForm(catalog, egress).subscribe(() => {
      this.toast.info('Los cambios se enviaron; el procesador de pagos los aplica en un momento');
      this.refreshAfterAsync();
    });
  }

  protected remove(): void {
    const egress = this.egress();
    if (!egress) {
      return;
    }
    this.dialogs.confirmDelete(egress).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.egressService.delete(egress.id).subscribe({
        next: () => {
          this.toast.info('El egreso se envió a eliminar; el procesador lo aplica en un momento');
          void this.router.navigate(['/egresos']);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(egressErrorMessage(error, 'No se pudo eliminar el egreso')),
      });
    });
  }

  protected load(silent: boolean): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);
    (silent ? this.viewService.reload() : this.viewService.load()).subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(egressErrorMessage(error, 'No se pudo cargar el egreso'));
      },
    });
  }

  private refreshAfterAsync(): void {
    this.processing.set(true);
    REFRESH_DELAYS_MS.forEach((delay, index) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.load(true);
        if (index === REFRESH_DELAYS_MS.length - 1) {
          this.processing.set(false);
        }
      }, delay);
      this.timers.add(timer);
    });
  }
}
