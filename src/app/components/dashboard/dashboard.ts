import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogItem } from '../../models/product/catalog-item.model';
import { CatalogService } from '../../services/product/catalog.service';
import { NAVIGATION, isReady } from '../../config/navigation/navigation';
import { HeadquarterService } from '../../services/headquarter/headquarter.service';
import { SessionService } from '../../services/session/session.service';
import { KpiCard } from '../shared/kpi-card';

const LOW_STOCK = 5;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, KpiCard],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly headquarterService = inject(HeadquarterService);
  protected readonly session = inject(SessionService);

  protected readonly firstName = computed(
    () => (this.session.profile()?.fullName ?? '').split(' ')[0],
  );
  protected readonly activeHeadquarters = signal<number | null>(null);
  protected readonly clinicItems = signal<CatalogItem[] | null>(null);
  protected readonly headquarterItems = signal<CatalogItem[] | null>(null);

  protected readonly productCount = computed(
    () => this.clinicItems()?.filter((item) => item.type === 'PRODUCT').length ?? null,
  );
  protected readonly serviceCount = computed(
    () => this.clinicItems()?.filter((item) => item.type === 'SERVICE').length ?? null,
  );
  protected readonly lowStock = computed(
    () =>
      this.headquarterItems()
        ?.filter((item) => item.type === 'PRODUCT' && (item.stockAtLocation ?? 0) <= LOW_STOCK)
        .sort((a, b) => (a.stockAtLocation ?? 0) - (b.stockAtLocation ?? 0)) ?? null,
  );

  protected readonly modules = computed(() => {
    const roles = this.session.profile()?.roles ?? [];
    return NAVIGATION.map((group) => ({
      ...group,
      modules: group.modules.filter((module) => module.roles.some((role) => roles.includes(role))),
    })).filter((group) => group.modules.length > 0);
  });
  protected readonly lowStockLimit = LOW_STOCK;
  protected readonly isReady = isReady;

  constructor() {
    effect((onCleanup) => {
      const headquarterId = this.session.headquarterId();
      this.headquarterItems.set(null);
      if (headquarterId === null) {
        return;
      }
      const subscription = this.catalogService
        .list({ active: true, type: 'PRODUCT', headquarterId })
        .subscribe({
          next: (items) => this.headquarterItems.set(items),
          error: () => this.headquarterItems.set([]),
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.headquarterService.list().subscribe({
      next: (headquarters) =>
        this.activeHeadquarters.set(
          headquarters.filter((headquarter) => headquarter.isActive).length,
        ),
      error: () => this.activeHeadquarters.set(null),
    });
    this.catalogService.list({ active: true }).subscribe({
      next: (items) => this.clinicItems.set(items),
      error: () => this.clinicItems.set([]),
    });
  }
}
