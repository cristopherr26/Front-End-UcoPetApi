
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';

import {
  SaleItem,
  SaleOrder,
} from '../../../models/sale/sale.model';

import { SaleService } from '../../../services/sale/sale.service';
import { ToastService } from '../../../services/shared/toast.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { PricePipe } from '../../../pipes/shared/price.pipe';

import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { SaleForm } from '../sale-form/sale-form';
import { SaleItemForm } from '../sale-item-form/sale-item-form';

import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { PetService } from '../../../services/pet/pet.service';
import { HealthPlanService } from '../../../services/health-plan/health-plan.service';
import { CatalogService } from '../../../services/product/catalog.service';

@Component({
  selector: 'app-sale-detail',
  imports: [
    DatePipe,
    RouterLink,
    PricePipe,
    EmptyState,
    PageHeader,
  ],
  templateUrl: './sale-detail.html',
})
export class SaleDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly service = inject(SaleService);
  private readonly modal = inject(NgbModal);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();

  private readonly headquarterService = inject(HeadquarterService);
  private readonly tutorService = inject(TutorPetService);
  private readonly personService = inject(PersonLookupService);
  private readonly petService = inject(PetService);
  private readonly healthPlanService = inject(HealthPlanService);
  private readonly catalogService = inject(CatalogService);

  protected readonly order = signal<SaleOrder | null>(null);
  protected readonly items = signal<SaleItem[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly headquarterNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly tutorNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly petNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly healthPlanNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly referencesLoading = signal(false);
  protected readonly referencesError = signal<string | null>(null);

  protected readonly itemNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly itemNamesLoading = signal(false);
  protected readonly itemNamesError = signal<string | null>(null);

  private firstItemHandled = false;

  constructor() {
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('No se indicó una orden válida.');
      this.loading.set(false);
      return;
    }

    this.service.list().subscribe({
      next: (sales) => {
        const found = sales.find((sale) => sale.id === id);

        if (!found) {
          this.error.set('No se encontró la orden de venta.');
          this.loading.set(false);
          return;
        }

        this.order.set(found);

        this.loadReferences(found.headquarterId);

        this.loadItemNames(found.headquarterId);

        this.reloadItems();
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudo consultar la orden',
          ),
        );

        this.loading.set(false);
      },
    });
  }

  private loadReferences(headquarterId: string): void {
    this.referencesLoading.set(true);
    this.referencesError.set(null);

    forkJoin({
      headquarters: this.headquarterService.list(),
      tutors: this.tutorService.list(),
      persons: this.personService.byId(),
      pets: this.petService.getByHeadquarter({
        headquarterId,
      }),
      healthPlans: this.healthPlanService.getHealthPlans(),
    }).subscribe({
      next: ({
               headquarters,
               tutors,
               persons,
               pets,
               healthPlans,
             }) => {

        this.headquarterNames.set(
          new Map(
            headquarters.map((headquarter) => [
              headquarter.id,
              headquarter.name,
            ]),
          ),
        );

        this.tutorNames.set(
          new Map(
            tutors.map((tutor) => {
              const person = persons.get(tutor.person);

              const fullName = person
                ? `${person.firstName} ${person.lastName}`.trim()
                : 'Tutor no disponible';

              return [tutor.id, fullName];
            }),
          ),
        );

        this.petNames.set(
          new Map(
            pets.map((pet) => [
              pet.id,
              pet.name,
            ]),
          ),
        );

        this.healthPlanNames.set(
          new Map(
            healthPlans
              .filter((plan) => !!plan.id)
              .map((plan) => [
                plan.id!,
                plan.name,
              ]),
          ),
        );

        this.referencesLoading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.referencesError.set(
          apiErrorMessage(
            err,
            'No se pudieron cargar los nombres relacionados con la venta',
          ),
        );

        this.referencesLoading.set(false);
      },
    });
  }

  protected headquarterName(id: string): string {
    return this.headquarterNames().get(id)
      ?? 'Sede no disponible';
  }

  protected tutorName(id: string): string {
    return this.tutorNames().get(id)
      ?? 'Tutor no disponible';
  }

  protected petName(id: string): string {
    return this.petNames().get(id)
      ?? 'Mascota no disponible';
  }

  protected healthPlanName(id: string | null): string {
    if (
      !id ||
      id === '00000000-0000-0000-0000-000000000000'
    ) {
      return 'Sin póliza';
    }

    return this.healthPlanNames().get(id)
      ?? 'Póliza no disponible';
  }


  private loadItemNames(headquarterId: string): void {
    this.itemNamesLoading.set(true);
    this.itemNamesError.set(null);

    // Consultamos productos y servicios de la sede.
    // No aplicamos sellable=true, para poder resolver
    // también los nombres de artículos que hayan
    // dejado de estar habilitados para la venta.
    this.catalogService.list({
      headquarterId,
    }).subscribe({
      next: (catalogItems) => {
        const names = new Map<string, string>();

        for (const item of catalogItems) {
          names.set(item.id, item.name);
        }

        this.itemNames.set(names);
        this.itemNamesLoading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.itemNamesError.set(
          apiErrorMessage(
            err,
            'No se pudieron cargar los nombres de los artículos',
          ),
        );

        this.itemNamesLoading.set(false);
      },
    });
  }

  protected itemName(item: SaleItem): string {
    if (this.itemNamesLoading()) {
      return 'Cargando...';
    }

    return this.itemNames().get(item.itemId)
      ?? 'Artículo no disponible en el catálogo';
  }


  private reloadItems(): void {
    const current = this.order();

    if (!current) {
      return;
    }

    this.service.listItems(current.id).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);

        this.openFirstItemIfRequested();
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(
          apiErrorMessage(
            err,
            'No se pudieron consultar los ítems',
          ),
        );

        this.loading.set(false);
      },
    });
  }

  private openFirstItemIfRequested(): void {
    if (this.firstItemHandled) {
      return;
    }

    const shouldOpen =
      this.route.snapshot.queryParamMap.get('addItem') === '1';

    const current = this.order();

    if (!shouldOpen || current?.state !== 'BORRADOR') {
      return;
    }

    this.firstItemHandled = true;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { addItem: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).then((navigated) => {
      if (navigated) {
        this.itemDialog();
      }
    });
  }

  protected editOrder(): void {
    const current = this.order();

    if (!current || current.state !== 'BORRADOR') {
      return;
    }

    const ref = this.modal.open(SaleForm, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    ref.componentInstance.edit(current);

    ref.result.then(
      (updated: SaleOrder) => {
        this.order.set(updated);
        this.toast.success('Orden actualizada');

        this.loadReferences(updated.headquarterId);
        this.loadItemNames(updated.headquarterId);
        this.reloadItems();
      },
      () => undefined,
    );
  }

  protected itemDialog(item: SaleItem | null = null): void {
    const current = this.order();

    if (!current || current.state !== 'BORRADOR') {
      return;
    }

    const ref = this.modal.open(SaleItemForm, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    ref.componentInstance.openFor(current, item);

    ref.result.then(
      (updated: SaleOrder) => {
        this.order.set(updated);

        this.toast.success(
          item ? 'Ítem actualizado' : 'Ítem agregado',
        );

        // Actualizar los ítems y sus nombres
        this.reloadItems();
        this.loadItemNames(updated.headquarterId);
      },
      () => undefined,
    );
  }


  protected deleteItem(item: SaleItem): void {
    const current = this.order();

    if (!current || current.state !== 'BORRADOR') {
      return;
    }

    this.confirm(
      'Eliminar ítem',
      'El ítem se quitará de la orden y los totales se recalcularán.',
      'Eliminar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.busy.set(true);

      this.service.removeItem(current.id, item.id).subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.toast.success('Ítem eliminado');

          this.reloadItems();
          this.busy.set(false);
        },

        error: (err: HttpErrorResponse) => {
          this.toast.error(
            apiErrorMessage(
              err,
              'No se pudo eliminar el ítem',
            ),
          );

          this.busy.set(false);
        },
      });
    });
  }


  protected cancelOrder(): void {
    const current = this.order();

    if (!current || current.state !== 'BORRADOR') {
      return;
    }

    this.confirm(
      'Anular venta',
      `¿Deseas anular la orden ${current.orderNumber}?`,
      'Anular orden',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.busy.set(true);

      this.service.cancel(current.id).subscribe({
        next: (updated) => {
          this.order.set(updated);

          this.toast.info(
            'Orden anulada; se notificó al procesador comercial',
          );

          this.busy.set(false);
        },

        error: (err: HttpErrorResponse) => {
          this.toast.error(
            apiErrorMessage(
              err,
              'No se pudo anular la venta',
            ),
          );

          this.busy.set(false);
        },
      });
    });
  }
}
