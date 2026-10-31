import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { Service } from '../../../models/product/service.model';
import {
  SERVICE_CATEGORIES,
  ServiceCategory,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../../models/product/catalog-enums';
import { ServiceService } from '../../../services/product/service.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { bindPriceToSellable, blankToNull } from '../../../utils/product/form-rules';

@Component({
  selector: 'app-service-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss',
})
export class ServiceForm implements OnInit {
  private readonly serviceService = inject(ServiceService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly categories = SERVICE_CATEGORIES;
  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(255)],
    imageUrl: ['', Validators.maxLength(500)],
    category: this.fb.control<ServiceCategory | null>(null, Validators.required),
    taxCategory: this.fb.control<TaxCategory | null>(null, Validators.required),
    sellable: [true],
    purchasable: [false],
    price: this.fb.control<number | null>(null),
  });
  protected readonly serviceId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly headquarterSearch = signal('');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  private readonly allHeadquarters = signal<Headquarter[]>([]);
  private active = true;

  protected readonly headquarters = computed(() => {
    const selected = this.selected();
    return this.allHeadquarters()
      .filter((headquarter) => headquarter.isActive || selected.has(headquarter.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  protected readonly visibleHeadquarters = computed(() => {
    const term = this.headquarterSearch().trim().toLowerCase();
    return term === ''
      ? this.headquarters()
      : this.headquarters().filter((headquarter) => headquarter.name.toLowerCase().includes(term));
  });

  constructor() {
    const subscription = bindPriceToSellable(this.form.controls.sellable, this.form.controls.price);
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  ngOnInit(): void {
    this.headquarterService.list().subscribe({
      next: (headquarters) => this.allHeadquarters.set(headquarters),
      error: (error: HttpErrorResponse) =>
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar las sedes')),
    });
  }

  edit(id: string): void {
    this.serviceId.set(id);
    this.loading.set(true);
    this.serviceService.getById(id).subscribe({
      next: (service) => {
        this.active = service.active ?? true;
        this.selected.set(new Set(service.headquarterIds));
        this.form.patchValue({
          name: service.name,
          description: service.description ?? '',
          imageUrl: service.imageUrl ?? '',
          category: service.category,
          taxCategory: service.taxCategory,
          sellable: service.sellable,
          purchasable: service.purchasable,
          price: service.price,
        });
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se encontró el servicio'));
      },
    });
  }

  protected toggle(headquarterId: string, checked: boolean): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(headquarterId);
      } else {
        next.delete(headquarterId);
      }
      return next;
    });
  }

  protected selectVisible(checked: boolean): void {
    const ids = this.visibleHeadquarters().map((headquarter) => headquarter.id);
    this.selected.update((current) => {
      const next = new Set(current);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const service: Service = {
      name: value.name.trim(),
      description: blankToNull(value.description),
      imageUrl: blankToNull(value.imageUrl),
      category: value.category as ServiceCategory,
      taxCategory: value.taxCategory as TaxCategory,
      sellable: value.sellable,
      purchasable: value.purchasable,
      price: value.sellable ? value.price : null,
      headquarterIds: [...this.selected()],
      active: this.active,
    };
    const id = this.serviceId();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.serviceService.update(id, service) : this.serviceService.create(service)).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar el servicio'));
      },
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
