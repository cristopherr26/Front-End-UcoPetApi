import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, of } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import {
  CreatePurchaseRequest,
  Purchase,
  PurchaseSupplierOption,
} from '../../../models/purchases/purchase.model';
import { CatalogItem } from '../../../models/product/catalog-item.model';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { TAX_CATEGORIES, TaxCategory, labelOf } from '../../../models/product/catalog-enums';
import { PurchaseService } from '../../../services/purchases/purchase.service';
import { CatalogService } from '../../../services/product/catalog.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  ITEMS_MIN_RULE,
  PRICE_RULES,
  PURCHASE_NUMBER_MAX,
  PURCHASE_NUMBER_MIN,
  QUANTITY_RULES,
  uniqueItemsValidator,
} from '../../../utils/purchases/form-rules';

// Cada fila de la compra: ítem del catálogo + cantidad + precio de compra + categoría fiscal.
function createItemGroup(
  fb: NonNullableFormBuilder,
  productId = '',
  quantity: number | null = 1,
  unitPrice: number | null = null,
  taxCategory: TaxCategory | '' = '',
) {
  return fb.group({
    productId: [productId, Validators.required],
    quantity: fb.control<number | null>(quantity, QUANTITY_RULES),
    unitPrice: fb.control<number | null>(unitPrice, PRICE_RULES),
    taxCategory: fb.control<TaxCategory | ''>(taxCategory, Validators.required),
  });
}

type ItemGroup = ReturnType<typeof createItemGroup>;

@Component({
  selector: 'app-purchase-form',
  imports: [ReactiveFormsModule, ModalFrame, PricePipe],
  templateUrl: './purchase-form.html',
})
export class PurchaseForm implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly catalogService = inject(CatalogService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  // Catálogos para los desplegables.
  protected readonly suppliers = signal<PurchaseSupplierOption[]>([]);
  protected readonly headquarters = signal<Headquarter[]>([]);
  protected readonly catalogItems = signal<CatalogItem[]>([]);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly labelOf = labelOf;
  protected readonly numberMax = PURCHASE_NUMBER_MAX;
  protected readonly numberMin = PURCHASE_NUMBER_MIN;

  protected readonly form = this.fb.group({
    purchaseNumber: [
      '',
      [
        Validators.required,
        Validators.minLength(this.numberMin),
        Validators.maxLength(this.numberMax),
        Validators.pattern(/^\S+$/),
      ],
    ],
    supplierId: ['', Validators.required],
    headquarterId: ['', Validators.required],
    hasDiscount: [false],
    items: this.fb.array<ItemGroup>([], [ITEMS_MIN_RULE, uniqueItemsValidator]),
  });

  ngOnInit(): void {
    if (this.items.length === 0) {
      this.addItem();
    }
    this.loadCatalogs();
  }

  protected get items() {
    return this.form.controls.items;
  }

  // Cargar proveedores, sedes e ítems comprables del catálogo.
  private loadCatalogs(): void {
    this.loading.set(true);

    forkJoin({
      suppliers: this.purchaseService.listSuppliers().pipe(
        catchError((error) => {
          console.error('Error cargando proveedores:', error);
          return of([] as PurchaseSupplierOption[]);
        }),
      ),
      headquarters: this.headquarterService.list().pipe(
        catchError((error) => {
          console.error('Error cargando sedes:', error);
          return of([] as Headquarter[]);
        }),
      ),
      items: this.catalogService.list({ active: true }).pipe(
        catchError((error) => {
          console.error('Error cargando el catálogo:', error);
          return of([] as CatalogItem[]);
        }),
      ),
    }).subscribe(({ suppliers, headquarters, items }) => {
      this.suppliers.set(suppliers.filter((supplier) => supplier.active));
      const activeHeadquarters = headquarters.filter((headquarter) => headquarter.isActive);
      this.headquarters.set(activeHeadquarters);
      // El catálogo no filtra por "purchasable" en la API; lo filtramos aquí.
      this.catalogItems.set(items.filter((item) => item.purchasable !== false));
      this.loading.set(false);

      // Precargar la sede activa (la misma que filtra el listado de compras),
      // para que una compra creada aparezca de una vez en la lista; antes
      // quedaba en blanco y había que elegirla a mano, y si se dejaba otra
      // sede distinta a la activa, la compra se creaba bien pero no se veía
      // en el listado (que solo filtra por la sede activa).
      const activeHeadquarterId = this.session.headquarterId();
      if (
        activeHeadquarterId &&
        activeHeadquarters.some((headquarter) => headquarter.id === activeHeadquarterId)
      ) {
        this.form.controls.headquarterId.setValue(activeHeadquarterId);
      }
    });
  }

  protected itemLabel(item: CatalogItem): string {
    const type = item.type === 'PRODUCT' ? 'Producto' : 'Servicio';
    return `${item.name} (${type})`;
  }

  protected addItem(): void {
    this.items.push(createItemGroup(this.fb));
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // Al elegir un ítem del catálogo sugerimos su categoría fiscal; el usuario puede cambiarla.
  protected onItemSelected(index: number, productId: string): void {
    const catalogItem = this.catalogItems().find((item) => item.id === productId);
    const control = this.items.at(index).controls.taxCategory;
    if (catalogItem && !control.value) {
      control.setValue(catalogItem.taxCategory);
    }
  }

  // El precio se deja como texto libre (en vez de <input type="number">,
  // que no permite escribir separador de miles). No se le reescribe el valor
  // mientras el usuario teclea (eso evita el bug de "no me deja escribir mas
  // numeros"); solo se lee y se interpreta en formato colombiano para el form.
  // La vista en pesos colombianos se muestra aparte, debajo, como referencia.
  protected onUnitPriceInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = this.parsePriceValue(input.value);
    this.items.at(index).controls.unitPrice.setValue(numericValue);
  }

  protected onUnitPriceBlur(index: number): void {
    this.items.at(index).controls.unitPrice.markAsTouched();
  }

  // Interpreta el precio en formato colombiano: la coma es el separador
  // decimal (p. ej. "1.500,00") y los puntos son de miles. Sin coma, si el
  // ultimo grupo separado por puntos tiene 3 digitos (p. ej. "1.500.000" o
  // "1.500") se asume que todos los puntos son de miles y el numero es
  // entero; si tiene 1 o 2 digitos (p. ej. "1500.30" o "10.000.50") el ultimo
  // punto se toma como decimal y los anteriores como miles.
  private parsePriceValue(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, '');
    if (cleaned === '') {
      return null;
    }

    if (cleaned.includes(',')) {
      const lastComma = cleaned.lastIndexOf(',');
      const integerPart = cleaned.slice(0, lastComma).replace(/\./g, '');
      const decimalPart = cleaned.slice(lastComma + 1).replace(/[.,]/g, '');
      const numericValue = Number(`${integerPart || '0'}.${decimalPart}`);
      return Number.isNaN(numericValue) ? null : numericValue;
    }

    const segments = cleaned.split('.');
    if (segments.length > 1) {
      const last = segments[segments.length - 1];
      if (last.length === 3) {
        const numericValue = Number(segments.join(''));
        return Number.isNaN(numericValue) ? null : numericValue;
      }
      const integerPart = segments.slice(0, -1).join('');
      const numericValue = Number(`${integerPart || '0'}.${last}`);
      return Number.isNaN(numericValue) ? null : numericValue;
    }

    const numericValue = Number(cleaned);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: CreatePurchaseRequest = {
      purchaseNumber: value.purchaseNumber.trim(),
      supplierId: value.supplierId,
      headquarterId: value.headquarterId,
      // El backend solo guarda esta bandera informativa, no calcula ningun
      // descuento sobre el total; es solo para dejar registrado si hubo o no.
      hasDiscount: value.hasDiscount,
      items: value.items.map((item) => {
        const catalogItem = this.catalogItems().find((entry) => entry.id === item.productId);
        return {
          productId: item.productId,
          itemType: catalogItem?.type ?? 'PRODUCT',
          quantity: item.quantity as number,
          unitPrice: item.unitPrice as number,
          taxCategory: item.taxCategory as TaxCategory,
        };
      }),
    };

    this.saving.set(true);
    this.error.set(null);
    this.purchaseService.create(request).subscribe({
      next: (response: Purchase) => this.modal.close(response),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo crear la compra'));
      },
    });
  }

  protected invalid(field: 'purchaseNumber' | 'supplierId' | 'headquarterId'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected hasError(
    field: 'purchaseNumber' | 'supplierId' | 'headquarterId',
    error: string,
  ): boolean {
    const control = this.form.controls[field];
    return control.touched && control.hasError(error);
  }

  protected itemInvalid(
    index: number,
    field: 'productId' | 'quantity' | 'unitPrice' | 'taxCategory',
  ): boolean {
    const control = this.items.at(index).controls[field];
    return control.touched && control.invalid;
  }
}
