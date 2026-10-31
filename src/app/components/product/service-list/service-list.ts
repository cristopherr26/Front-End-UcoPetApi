import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { SessionService } from '../../../services/session/session.service';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { TablePager } from '../../shared/table-pager';
import { Service } from '../../../models/product/service.model';
import {
  SERVICE_CATEGORIES,
  ServiceCategory,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../../models/product/catalog-enums';
import { ServiceService } from '../../../services/product/service.service';
import { CatalogDialogs } from '../../../services/product/catalog-dialogs.service';
import { serviceCategoryLabel, taxLabel } from '../../../utils/product/catalog-labels';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';

@Component({
  selector: 'app-service-list',
  imports: [PricePipe, SortHeader, TablePager],
  templateUrl: './service-list.html',
})
export class ServiceList {
  private readonly serviceService = inject(ServiceService);
  private readonly dialogs = inject(CatalogDialogs);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  protected readonly categories = SERVICE_CATEGORIES;
  protected readonly taxCategories = TAX_CATEGORIES;
  protected readonly active = signal(true);
  protected readonly category = signal<ServiceCategory | null>(null);
  protected readonly taxCategory = signal<TaxCategory | null>(null);
  protected readonly search = signal('');
  private readonly refresh = signal(0);

  protected readonly services = signal<Service[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term === ''
      ? this.services()
      : this.services().filter((service) => service.name.toLowerCase().includes(term));
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'name',
    accessors: {
      name: (service) => service.name,
      category: (service) => serviceCategoryLabel(service.category),
      price: (service) => (service.sellable ? service.price : null),
      tax: (service) => taxLabel(service.taxCategory),
      purchasable: (service) => service.purchasable,
      headquarters: (service) => service.headquarterIds.length,
    },
  });

  protected readonly categoryLabel = serviceCategoryLabel;
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
      const subscription = this.serviceService.list(filters).subscribe({
        next: (services) => {
          this.services.set(services);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.services.set([]);
          this.loading.set(false);
          this.error.set(apiErrorMessage(error, 'No se pudieron cargar los servicios'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected create(): void {
    this.dialogs.service().subscribe((saved) => this.afterSave(saved));
  }

  protected edit(service: Service): void {
    this.dialogs.service(service.id).subscribe((saved) => this.afterSave(saved));
  }

  protected deactivate(service: Service): void {
    this.confirm(
      'Dar de baja el servicio',
      `"${service.name}" dejará de aparecer en el catálogo activo.`,
      'Dar de baja',
    ).subscribe((confirmed) => {
      if (!confirmed || !service.id) {
        return;
      }
      this.serviceService.deactivate(service.id).subscribe({
        next: () => {
          this.services.update((services) => services.filter((item) => item.id !== service.id));
          this.toast.info(
            `"${service.name}" se envió a dar de baja; el procesador lo aplica en un momento`,
          );
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo dar de baja')),
      });
    });
  }

  protected setCategory(value: string): void {
    this.category.set(value === '' ? null : (value as ServiceCategory));
  }

  protected setTax(value: string): void {
    this.taxCategory.set(value === '' ? null : (value as TaxCategory));
  }

  private afterSave(saved: Service): void {
    this.toast.success(`"${saved.name}" quedó guardado`);
    this.refresh.update((value) => value + 1);
  }
}
