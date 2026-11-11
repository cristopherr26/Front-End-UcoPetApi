import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RouterLink } from '@angular/router';

import { KpiCard } from '../../shared/kpi-card';
import { TablePager } from '../../shared/table-pager';
import { SortHeader } from '../../../directives/shared/sort-header';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { PayMethodIconPipe } from '../../../pipes/egress/pay-method-icon.pipe';
import { createTableState } from '../../../utils/shared/table-state';
import { ToastService } from '../../../services/shared/toast.service';
import {
  EMPTY_FILTERS,
  EgressCatalog,
  EgressFilters,
  EgressView,
} from '../../../models/egress/egress.model';
import { EgressService } from '../../../services/egress/egress.service';
import { EgressViewService } from '../../../services/egress/egress-view.service';
import { EgressDialogsService } from '../../../services/egress/egress-dialogs.service';
import { egressErrorMessage } from '../../../utils/egress/egress-error';
import {
  applyEgressFilters,
  hasActiveFilters,
  invalidDateRange,
} from '../../../utils/egress/egress-filters';
import { summarize } from '../../../utils/egress/egress-summary';
import { REFRESH_DELAYS_MS } from '../../../utils/egress/form-rules';

@Component({
  selector: 'app-egress-list',
  imports: [DatePipe, RouterLink, KpiCard, TablePager, SortHeader, PricePipe, PayMethodIconPipe],
  templateUrl: './egress-list.html',
  styleUrl: './egress-list.scss',
})
export class EgressList implements OnInit {
  private readonly viewService = inject(EgressViewService);
  private readonly egressService = inject(EgressService);
  private readonly dialogs = inject(EgressDialogsService);
  private readonly toast = inject(ToastService);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  protected readonly catalog = signal<EgressCatalog | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingIds = signal<ReadonlySet<string>>(new Set());

  protected readonly filters = signal<EgressFilters>(EMPTY_FILTERS);
  protected readonly searchText = signal('');
  private readonly search = toSignal(
    toObservable(this.searchText).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );
  private readonly appliedFilters = computed(() => ({ ...this.filters(), search: this.search() }));

  protected readonly egresses = computed(() => this.catalog()?.egresses ?? []);
  protected readonly providers = computed(() =>
    [...(this.catalog()?.providers ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
  );
  protected readonly payMethods = computed(() => this.catalog()?.payMethods ?? []);

  protected readonly visible = computed(() =>
    applyEgressFilters(this.egresses(), this.appliedFilters()),
  );
  protected readonly hasFilters = computed(
    () => hasActiveFilters(this.filters()) || this.searchText().trim() !== '',
  );
  protected readonly badRange = computed(() => invalidDateRange(this.filters()));

  protected readonly summary = computed(() => summarize(this.egresses()));
  protected readonly visibleTotal = computed(() => summarize(this.visible()).total);
  protected readonly topProvider = computed(() => this.summary().byProvider.at(0) ?? null);

  protected readonly table = createTableState(this.visible, {
    sortKey: 'date',
    direction: 'desc',
    accessors: {
      date: (egress) => egress.date,
      concept: (egress) => egress.concept,
      provider: (egress) => egress.providerName,
      purchase: (egress) => egress.purchaseNumber,
      payMethod: (egress) => egress.payMethodName,
      total: (egress) => egress.total,
    },
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  ngOnInit(): void {
    this.load(false);
  }

  protected setFilter<K extends keyof EgressFilters>(key: K, value: EgressFilters[K]): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected clearFilters(): void {
    this.filters.set(EMPTY_FILTERS);
    this.searchText.set('');
  }

  protected isPending(egress: EgressView): boolean {
    return this.pendingIds().has(egress.id);
  }

  protected create(): void {
    const catalog = this.catalog();
    if (!catalog) {
      return;
    }
    this.dialogs.openForm(catalog, null).subscribe((accepted) => {
      this.toast.info('El egreso se envió; el procesador de pagos lo registra en un momento');
      this.refreshAfterAsync(accepted.id);
    });
  }

  protected edit(egress: EgressView): void {
    const catalog = this.catalog();
    if (!catalog) {
      return;
    }
    this.dialogs.openForm(catalog, egress).subscribe(() => {
      this.toast.info('Los cambios se enviaron; el procesador de pagos los aplica en un momento');
      this.refreshAfterAsync(egress.id);
    });
  }

  protected remove(egress: EgressView): void {
    this.dialogs.confirmDelete(egress).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.egressService.delete(egress.id).subscribe({
        next: () => {
          this.toast.info('El egreso se envió a eliminar; el procesador lo aplica en un momento');
          this.refreshAfterAsync(egress.id);
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
        this.error.set(egressErrorMessage(error, 'No se pudieron cargar los egresos'));
      },
    });
  }

  private refreshAfterAsync(id: string): void {
    this.pendingIds.update((ids) => new Set(ids).add(id));
    REFRESH_DELAYS_MS.forEach((delay, index) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.load(true);
        if (index === REFRESH_DELAYS_MS.length - 1) {
          this.pendingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
        }
      }, delay);
      this.timers.add(timer);
    });
  }
}
