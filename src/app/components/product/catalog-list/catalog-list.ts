import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { CatalogItem } from '../../../models/product/catalog-item.model';
import {
  CatalogItemType,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../../models/product/catalog-enums';
import { CatalogService } from '../../../services/product/catalog.service';
import { CatalogDialogs } from '../../../services/product/catalog-dialogs.service';
import {
  productCategoryLabel,
  serviceCategoryLabel,
  taxLabel,
} from '../../../utils/product/catalog-labels';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';

@Component({
  selector: 'app-catalog-list',
  imports: [RouterLink, PricePipe, SortHeader, TablePager],
  templateUrl: './catalog-list.html',
})
export class CatalogList {
  private readonly catalogService = inject(CatalogService);
  private readonly dialogs = inject(CatalogDialogs);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);

  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly type = signal<CatalogItemType | null>(null);
  protected readonly active = signal(true);
  protected readonly taxCategory = signal<TaxCategory | null>(null);
  protected readonly search = signal('');
  private readonly refresh = signal(0);

  protected readonly items = signal<CatalogItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term === ''
      ? this.items()
      : this.items().filter((item) => item.name.toLowerCase().includes(term));
  });
  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (item) => item.name,
      category: (item) => this.categoryLabel(item),
      price: (item) => (item.sellable ? item.price : null),
      tax: (item) => taxLabel(item.taxCategory),
      here: (item) =>
        item.type === 'PRODUCT' ? (item.stockAtLocation ?? 0) : this.offeredHere(item) ? 1 : 0,
    },
  });
  protected readonly productCount = computed(
    () => this.items().filter((item) => item.type === 'PRODUCT').length,
  );
  protected readonly serviceCount = computed(
    () => this.items().filter((item) => item.type === 'SERVICE').length,
  );
  protected readonly unitsAtHeadquarter = computed(() =>
    this.items().reduce((sum, item) => sum + (item.stockAtLocation ?? 0), 0),
  );

  protected readonly taxLabel = taxLabel;

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const filters = {
        type: this.type(),
        active: this.active(),
        taxCategory: this.taxCategory(),
        headquarterId: this.session.headquarterId(),
      };
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.catalogService.list(filters).subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.items.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudo cargar el catálogo'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected categoryLabel(item: CatalogItem): string {
    return item.type === 'PRODUCT'
      ? productCategoryLabel(item.category)
      : serviceCategoryLabel(item.category);
  }

  protected offeredHere(item: CatalogItem): boolean {
    return item.headquarterIds?.includes(this.session.headquarterId() ?? '') ?? false;
  }

  protected edit(item: CatalogItem): void {
    const dialog: Observable<{ name: string }> =
      item.type === 'PRODUCT' ? this.dialogs.product(item.id) : this.dialogs.service(item.id);
    dialog.subscribe((saved) => {
      this.toast.success(`"${saved.name}" quedó guardado`);
      this.refresh.update((value) => value + 1);
    });
  }

  protected setType(value: string): void {
    this.type.set(value === '' ? null : (value as CatalogItemType));
  }

  protected setTax(value: string): void {
    this.taxCategory.set(value === '' ? null : (value as TaxCategory));
  }
}
