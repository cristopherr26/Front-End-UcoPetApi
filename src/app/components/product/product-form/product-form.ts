import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { first, forkJoin, map } from 'rxjs';

import { ModalFrame } from '../../shared/modal-frame';
import { Product } from '../../../models/product/product.model';
import {
  PRODUCT_CATEGORIES,
  ProductCategory,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../../models/product/catalog-enums';
import { ProductService } from '../../../services/product/product.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  NAME_RULES,
  bindPriceToSellable,
  blankToNull,
  mergePatch,
  uniqueName,
} from '../../../utils/product/form-rules';

const PATCH_FIELDS: readonly (keyof Product)[] = [
  'name',
  'description',
  'imageUrl',
  'category',
  'taxCategory',
  'sellable',
  'price',
];

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly productService = inject(ProductService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly form = this.fb.group({
    name: this.fb.control('', {
      validators: NAME_RULES,
      asyncValidators: Validators.composeAsync([
        uniqueName(
          forkJoin([
            this.productService.list({ active: true }),
            this.productService.list({ active: false }),
          ]).pipe(map(([active, inactive]) => [...active, ...inactive])),
          () => this.productId(),
        ),
      ]),
    }),
    description: ['', Validators.maxLength(255)],
    imageUrl: ['', Validators.maxLength(500)],
    category: this.fb.control<ProductCategory | null>(null, Validators.required),
    taxCategory: this.fb.control<TaxCategory | null>(null, Validators.required),
    sellable: [true],
    price: this.fb.control<number | null>(null),
  });
  protected readonly productId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private active = true;
  private original: Product | null = null;

  constructor() {
    const subscription = bindPriceToSellable(this.form.controls.sellable, this.form.controls.price);
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  edit(id: string): void {
    this.productId.set(id);
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.active = product.active ?? true;
        this.form.patchValue({
          name: product.name,
          description: product.description ?? '',
          imageUrl: product.imageUrl ?? '',
          category: product.category,
          taxCategory: product.taxCategory,
          sellable: product.sellable,
          price: product.price,
        });
        this.original = this.toProduct();
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se encontró el producto'));
      },
    });
  }

  protected save(): void {
    if (this.form.pending) {
      this.form.statusChanges
        .pipe(first((status) => status !== 'PENDING'))
        .subscribe(() => this.save());
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const product = this.toProduct();
    const id = this.productId();
    const changes = id && this.original ? mergePatch(this.original, product, PATCH_FIELDS) : null;
    if (id && changes && Object.keys(changes).length === 0) {
      this.modal.close({ ...product, id });
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    (id && changes
      ? this.productService.patch(id, changes)
      : this.productService.create(product)
    ).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar el producto'));
      },
    });
  }

  private toProduct(): Product {
    const value = this.form.getRawValue();
    return {
      name: value.name.trim(),
      description: blankToNull(value.description),
      imageUrl: blankToNull(value.imageUrl),
      category: value.category as ProductCategory,
      taxCategory: value.taxCategory as TaxCategory,
      sellable: value.sellable,
      price: value.sellable ? value.price : null,
      active: this.active,
    };
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
