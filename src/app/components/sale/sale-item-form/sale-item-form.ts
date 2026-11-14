
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { CatalogItem } from '../../../models/product/catalog-item.model';
import {
  SaleItem,
  SaleOrder,
  SaleItemType,
} from '../../../models/sale/sale.model';

import { CatalogService } from '../../../services/product/catalog.service';
import { ProductService } from '../../../services/product/product.service';
import { ServiceService } from '../../../services/product/service.service';
import { SaleService } from '../../../services/sale/sale.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { ModalFrame } from '../../shared/modal-frame';

@Component({
  selector: 'app-sale-item-form',
  imports: [ReactiveFormsModule, PricePipe, ModalFrame],
  templateUrl: './sale-item-form.html',
})
export class SaleItemForm {
  protected readonly modal = inject(NgbActiveModal);

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sales = inject(SaleService);
  private readonly catalog = inject(CatalogService);

  // Servicios para consultar el nombre del artículo.
  private readonly products = inject(ProductService);
  private readonly services = inject(ServiceService);

  protected readonly order = signal<SaleOrder | null>(null);
  protected readonly existing = signal<SaleItem | null>(null);
  protected readonly items = signal<CatalogItem[]>([]);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  // Nombre visible cuando editamos un artículo.
  protected readonly editingItemName = signal('');

  // Error no bloqueante al consultar el nombre.
  protected readonly nameError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    itemId: ['', Validators.required],
    quantity: [
      1,
      [
        Validators.required,
        Validators.min(1),
        Validators.pattern(/^[1-9]\d*$/),
      ],
    ],
  });

  private readonly formItemId = signal('');

  protected readonly selected = computed(() =>
    this.items().find(
      (item) => item.id === this.formItemId(),
    ),
  );

  // Texto visible del artículo seleccionado al editar.
  protected readonly editingItemLabel = computed(() => {
    const item = this.existing();

    if (!item) {
      return '';
    }

    const type =
      item.itemType === 'PRODUCTO'
        ? 'Producto'
        : 'Servicio';

    const name = this.editingItemName();

    return name
      ? `${type} · ${name}`
      : `${type} · Nombre no disponible`;
  });

  openFor(
    order: SaleOrder,
    item: SaleItem | null = null,
  ): void {
    this.order.set(order);
    this.existing.set(item);

    this.items.set([]);
    this.error.set(null);
    this.nameError.set(null);
    this.editingItemName.set('');
    this.loading.set(false);
    this.saving.set(false);

    this.form.patchValue({
      itemId: item?.itemId ?? '',
      quantity: item?.quantity ?? 1,
    });

    this.formItemId.set(item?.itemId ?? '');

    // Si estamos editando, consultamos únicamente
    // el artículo correspondiente para mostrar su nombre.
    if (item) {
      this.loadExistingItemName(item);
      return;
    }

    // Si estamos agregando, mantenemos el comportamiento
    // original de consultar el catálogo de la sede.
    this.loadCatalog(order.headquarterId);
  }

  private loadExistingItemName(item: SaleItem): void {
    this.loading.set(true);
    this.nameError.set(null);

    if (item.itemType === 'PRODUCTO') {
      this.products.getById(item.itemId).subscribe({
        next: (product) => {
          this.editingItemName.set(product.name);
          this.loading.set(false);
        },

        error: (err: HttpErrorResponse) => {
          this.nameError.set(
            apiErrorMessage(
              err,
              'No se pudo consultar el nombre del producto',
            ),
          );

          this.loading.set(false);
        },
      });

    } else {
      this.services.getById(item.itemId).subscribe({
        next: (service) => {
          this.editingItemName.set(service.name);
          this.loading.set(false);
        },

        error: (err: HttpErrorResponse) => {
          this.nameError.set(
            apiErrorMessage(
              err,
              'No se pudo consultar el nombre del servicio',
            ),
          );

          this.loading.set(false);
        },
      });
    }
  }

  private loadCatalog(headquarterId: string): void {
    this.loading.set(true);

    this.catalog.list({
      active: true,
      sellable: true,
      headquarterId,
    }).subscribe({
      next: (items) => {
        this.items.set(
          items.filter(
            (entry) =>
              entry.sellable &&
              entry.active &&
              entry.price !== null &&
              (
                entry.type === 'PRODUCT' ||
                entry.type === 'SERVICE'
              ) &&
              (
                entry.type === 'PRODUCT' ||
                entry.headquarterIds?.includes(
                  headquarterId,
                ) === true
              ),
          ),
        );

        this.loading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudo cargar el catálogo',
          ),
        );

        this.loading.set(false);
      },
    });
  }

  protected chooseItem(id: string): void {
    this.formItemId.set(id);
  }

  protected save(): void {
    const order = this.order();

    if (
      !order ||
      this.loading() ||
      this.saving() ||
      this.form.invalid
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const existing = this.existing();

    const { itemId, quantity } =
      this.form.getRawValue();

    const catalogItem = this.selected();


    if (
      !existing &&
      (!catalogItem || catalogItem.price === null)
    ) {
      this.error.set(
        'Selecciona un artículo válido del catálogo.',
      );
      return;
    }

    this.error.set(null);
    this.saving.set(true);

    const operation = existing
      ? this.sales.editItem(
        order.id,
        existing.id,
        {
          quantity,
          unitPrice: existing.unitPrice,
        },
      )
      : this.sales.addItem(
        order.id,
        {
          itemId,
          itemType: (
            catalogItem!.type === 'PRODUCT'
              ? 'PRODUCTO'
              : 'SERVICIO'
          ) as SaleItemType,
          quantity,
          unitPrice: catalogItem!.price!,
        },
      );

    operation.subscribe({
      next: (updated) => {
        this.modal.close(updated);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudo guardar el ítem',
          ),
        );

        this.saving.set(false);
      },
    });
  }
}
