import { Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { Product } from '../../../models/product/product.model';
import { Stock, StockMovement } from '../../../models/product/stock.model';
import { ProductService } from '../../../services/product/product.service';
import { StockService } from '../../../services/product/stock.service';
import { CatalogDialogs } from '../../../services/product/catalog-dialogs.service';
import { productCategoryLabel, reasonLabel } from '../../../utils/product/catalog-labels';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';

@Component({
  selector: 'app-stock-page',
  imports: [RouterLink, DatePipe, PricePipe, SortHeader, TablePager],
  templateUrl: './stock-page.html',
})
export class StockPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly stockService = inject(StockService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly dialogs = inject(CatalogDialogs);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);

  readonly id = input.required<string>();
  protected readonly product = signal<Product | null>(null);
  protected readonly headquarters = signal<Headquarter[]>([]);
  protected readonly stocks = signal<Stock[]>([]);
  protected readonly movements = signal<StockMovement[]>([]);
  protected readonly movementsHeadquarterId = signal<string | null>(this.session.headquarterId());
  protected readonly error = signal<string | null>(null);
  protected readonly movementsError = signal<string | null>(null);
  private readonly refresh = signal(0);

  protected readonly total = computed(() =>
    this.stocks().reduce((sum, stock) => sum + stock.quantity, 0),
  );
  protected readonly maxQuantity = computed(() =>
    Math.max(1, ...this.stocks().map((stock) => stock.quantity)),
  );
  protected readonly history = createTableState(this.movements, {
    sortKey: 'date',
    direction: 'desc',
    accessors: {
      date: (movement) => movement.occurredAt,
      headquarter: (movement) => this.headquarterName(movement.headquarterId),
      reason: (movement) => reasonLabel(movement.reason),
      quantity: (movement) => movement.quantity,
      balance: (movement) => movement.balanceAfter,
    },
  });
  protected readonly categoryLabel = productCategoryLabel;
  protected readonly reasonLabel = reasonLabel;

  constructor() {
    effect((onCleanup) => {
      this.refresh();
      const subscription = this.stockService.findByProduct(this.id()).subscribe({
        next: (stocks) => this.stocks.set([...stocks].sort((a, b) => b.quantity - a.quantity)),
        error: (error: HttpErrorResponse) =>
          this.error.set(apiErrorMessage(error, 'No se pudo cargar el stock')),
      });
      onCleanup(() => subscription.unsubscribe());
    });
    effect((onCleanup) => {
      this.refresh();
      this.movementsError.set(null);
      const subscription = this.stockService
        .findMovements(this.id(), this.movementsHeadquarterId())
        .subscribe({
          next: (movements) => this.movements.set(movements),
          error: (error: HttpErrorResponse) => {
            this.movements.set([]);
            this.movementsError.set(apiErrorMessage(error, 'No se pudo cargar el historial'));
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.productService.getById(this.id()).subscribe({
      next: (product) => this.product.set(product),
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'No se encontró el producto')),
    });
    this.headquarterService
      .list()
      .subscribe((headquarters) =>
        this.headquarters.set([...headquarters].sort((a, b) => a.name.localeCompare(b.name))),
      );
  }

  protected headquarterName(headquarterId: string): string {
    return (
      this.headquarters().find((headquarter) => headquarter.id === headquarterId)?.name ??
      'Sede sin nombre'
    );
  }

  protected share(quantity: number): number {
    return Math.round((quantity / this.maxQuantity()) * 100);
  }

  protected adjust(): void {
    const product = this.product();
    if (!product) {
      return;
    }
    this.dialogs.adjustStock(product, this.session.headquarterId()).subscribe((stock) => {
      this.toast.success(
        `Quedan ${stock.quantity} unidades en ${this.headquarterName(stock.headquarterId)}`,
      );
      this.refresh.update((value) => value + 1);
    });
  }

  protected setMovementsHeadquarter(value: string): void {
    this.movementsHeadquarterId.set(value === '' ? null : value);
  }
}
