import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { KpiCard } from '../../shared/kpi-card';
import { EmptyState } from '../../shared/empty-state';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { PayMethodIconPipe } from '../../../pipes/egress/pay-method-icon.pipe';
import { EMPTY_FILTERS, EgressCatalog } from '../../../models/egress/egress.model';
import { EgressViewService } from '../../../services/egress/egress-view.service';
import { egressErrorMessage } from '../../../utils/egress/egress-error';
import { applyEgressFilters, invalidDateRange } from '../../../utils/egress/egress-filters';
import { purchaseBalance, summarize } from '../../../utils/egress/egress-summary';

@Component({
  selector: 'app-egress-summary',
  imports: [RouterLink, KpiCard, EmptyState, PricePipe, PayMethodIconPipe],
  templateUrl: './egress-summary.html',
  styleUrl: './egress-summary.scss',
})
export class EgressSummaryPage implements OnInit {
  private readonly viewService = inject(EgressViewService);

  protected readonly catalog = signal<EgressCatalog | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  private readonly range = computed(() => ({
    ...EMPTY_FILTERS,
    dateFrom: this.dateFrom(),
    dateTo: this.dateTo(),
  }));
  protected readonly badRange = computed(() => invalidDateRange(this.range()));

  protected readonly egresses = computed(() =>
    applyEgressFilters(this.catalog()?.egresses ?? [], this.range()),
  );
  protected readonly summary = computed(() => summarize(this.egresses()));

  protected readonly orders = computed(() => {
    const catalog = this.catalog();
    if (!catalog) {
      return [];
    }
    const providerNames = new Map(catalog.providers.map((provider) => [provider.id, provider.name]));
    const withPayments = new Set(catalog.egresses.map((egress) => egress.purchaseOrder));
    return catalog.purchases
      .filter((purchase) => withPayments.has(purchase.id))
      .map((purchase) => {
        const balance = purchaseBalance(purchase, catalog.egresses);
        return {
          ...purchase,
          ...balance,
          providerName: providerNames.get(purchase.providerId) ?? 'Proveedor sin nombre',
          percent:
            purchase.total > 0 ? Math.min(100, Math.round((balance.paid / purchase.total) * 100)) : 0,
        };
      })
      .sort((a, b) => b.pending - a.pending);
  });

  protected readonly totalOwed = computed(() =>
    this.orders().reduce((sum, order) => sum + order.pending, 0),
  );

  ngOnInit(): void {
    this.load();
  }

  protected clearRange(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.viewService.load().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(egressErrorMessage(error, 'No se pudo cargar el resumen'));
      },
    });
  }
}
