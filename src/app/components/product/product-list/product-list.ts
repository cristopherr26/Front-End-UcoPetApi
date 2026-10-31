import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { Product } from '../../../models/product/product.model';
import {
  PRODUCT_CATEGORIES,
  ProductCategory,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../../models/product/catalog-enums';
import { ProductService } from '../../../services/product/product.service';
import { CatalogDialogs } from '../../../services/product/catalog-dialogs.service';
import { productCategoryLabel, taxLabel } from '../../../utils/product/catalog-labels';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, PricePipe, SortHeader, TablePager],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly productService = inject(ProductService);
  private readonly dialogs = inject(CatalogDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly active = signal(true);
  protected readonly category = signal<ProductCategory | null>(null);
  protected readonly taxCategory = signal<TaxCategory | null>(null);
  protected readonly search = signal('');
  private readonly refresh = signal(0);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term === ''
      ? this.products()
      : this.products().filter((product) => product.name.toLowerCase().includes(term));
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (product) => product.name,
      category: (product) => productCategoryLabel(product.category),
      price: (product) => (product.sellable ? product.price : null),
      tax: (product) => taxLabel(product.taxCategory),
      active: (product) => product.active,
    },
  });

  protected readonly categoryLabel = productCategoryLabel;
  protected readonly taxLabel = taxLabel;

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const filters = {
        active: this.active(),
        category: this.category(),
        taxCategory: this.taxCategory(),
      };
      this.loading.set(true);
      this.error.set(null);
      const subscription = this.productService.list(filters).subscribe({
        next: (products) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.products.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar los productos'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected create(): void {
    this.dialogs.product().subscribe((saved) => this.afterSave(saved));
  }

  protected edit(product: Product): void {
    this.dialogs.product(product.id).subscribe((saved) => this.afterSave(saved));
  }

  protected deactivate(product: Product): void {
    this.confirm(
      'Dar de baja el producto',
      `"${product.name}" dejará de aparecer en el catálogo activo.`,
      'Dar de baja',
    ).subscribe((confirmed) => {
      if (!confirmed || !product.id) {
        return;
      }
      this.productService.deactivate(product.id).subscribe({
        next: () => {
          this.products.update((products) => products.filter((item) => item.id !== product.id));
          this.toast.info(
            `"${product.name}" se envió a dar de baja; el procesador lo aplica en un momento`,
          );
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo dar de baja')),
      });
    });
  }

  protected setCategory(value: string): void {
    this.category.set(value === '' ? null : (value as ProductCategory));
  }

  protected setTax(value: string): void {
    this.taxCategory.set(value === '' ? null : (value as TaxCategory));
  }

  private afterSave(saved: Product): void {
    this.toast.success(`"${saved.name}" quedó guardado`);
    this.refresh.update((value) => value + 1);
  }
}
