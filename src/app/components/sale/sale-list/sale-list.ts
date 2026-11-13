
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, map, of, Subscription } from 'rxjs';

import {
  SaleOrder,
  SaleOrderState,
} from '../../../models/sale/sale.model';
import { Pet } from '../../../models/pet/pet.model';

import { SaleService } from '../../../services/sale/sale.service';
import { SessionService } from '../../../services/session/session.service';
import { ToastService } from '../../../services/shared/toast.service';
import { TutorPetService } from '../../../services/tutor-pet/tutor-pet.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { PetService } from '../../../services/pet/pet.service';

import { apiErrorMessage } from '../../../utils/shared/api-error';
import { createTableState } from '../../../utils/shared/table-state';
import { SortHeader } from '../../../directives/shared/sort-header';
import { PricePipe } from '../../../pipes/shared/price.pipe';

import { EmptyState } from '../../shared/empty-state';
import { KpiCard } from '../../shared/kpi-card';
import { PageHeader } from '../../shared/page-header';
import { TablePager } from '../../shared/table-pager';
import { SaleForm } from '../sale-form/sale-form';

@Component({
  selector: 'app-sale-list',
  imports: [
    DatePipe,
    RouterLink,
    SortHeader,
    PricePipe,
    EmptyState,
    KpiCard,
    PageHeader,
    TablePager,
  ],
  templateUrl: './sale-list.html',
})
export class SaleList {
  private readonly service = inject(SaleService);
  private readonly modal = inject(NgbModal);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly tutorService = inject(TutorPetService);
  private readonly personService = inject(PersonLookupService);
  private readonly petService = inject(PetService);

  protected readonly session = inject(SessionService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sales = signal<SaleOrder[]>([]);

  protected readonly search = signal('');
  protected readonly status = signal<SaleOrderState | ''>('');

  private readonly refresh = signal(0);

  protected readonly clientNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly petNames = signal<Map<string, string>>(
    new Map(),
  );

  protected readonly namesLoading = signal(false);
  protected readonly namesError = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const term = this.normalize(this.search());

    const clients = this.clientNames();
    const pets = this.petNames();

    return this.sales().filter((sale) => {
      const matchesStatus =
        !this.status() || sale.state === this.status();

      const orderNumber = this.normalize(sale.orderNumber);

      const clientName = this.normalize(
        clients.get(sale.clientID) ?? '',
      );

      const petName = this.normalize(
        pets.get(sale.petId) ?? '',
      );

      const matchesSearch =
        !term ||
        orderNumber.includes(term) ||
        clientName.includes(term) ||
        petName.includes(term);

      return matchesStatus && matchesSearch;
    });
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'date',
    direction: 'desc',
    accessors: {
      number: (sale) => sale.orderNumber,
      date: (sale) => sale.saleDate,
      client: (sale) =>
        this.clientNames().get(sale.clientID) ?? '',
      pet: (sale) =>
        this.petNames().get(sale.petId) ?? '',
      status: (sale) => sale.state,
      total: (sale) => sale.total,
    },
  });

  protected readonly draftCount = computed(
    () =>
      this.sales().filter(
        (sale) => sale.state === 'BORRADOR',
      ).length,
  );

  protected readonly cancelledCount = computed(
    () =>
      this.sales().filter(
        (sale) => sale.state === 'ANULADA',
      ).length,
  );

  protected readonly totalAmount = computed(() =>
    this.sales()
      .filter((sale) => sale.state !== 'ANULADA')
      .reduce((sum, sale) => sum + sale.total, 0),
  );

  protected readonly scope = computed(() =>
    this.session.headquarterId()
      ? 'Sede activa'
      : 'Toda la clínica',
  );

  constructor() {
    effect((onCleanup) => {
      this.refresh();

      const headquarterId = this.session.headquarterId();
      const subscriptions = new Subscription();

      this.loading.set(true);
      this.error.set(null);
      this.namesError.set(null);
      this.namesLoading.set(true);

      this.clientNames.set(new Map());
      this.petNames.set(new Map());

      const salesSubscription = this.service
        .list({ headquarterId })
        .subscribe({
          next: (sales) => {
            this.sales.set(sales);
            this.loading.set(false);

            subscriptions.add(
              this.loadNames(sales).subscribe({
                next: ({ clientNames, petNames }) => {
                  this.clientNames.set(clientNames);
                  this.petNames.set(petNames);
                  this.namesLoading.set(false);
                },

                error: (err: HttpErrorResponse) => {
                  this.namesError.set(
                    apiErrorMessage(
                      err,
                      'No se pudieron consultar los nombres de clientes y mascotas',
                    ),
                  );
                  this.namesLoading.set(false);
                },
              }),
            );
          },

          error: (err: HttpErrorResponse) => {
            this.sales.set([]);
            this.loading.set(false);
            this.namesLoading.set(false);

            this.error.set(
              apiErrorMessage(
                err,
                'No se pudieron cargar las ventas',
              ),
            );
          },
        });

      subscriptions.add(salesSubscription);

      onCleanup(() => subscriptions.unsubscribe());
    });
  }

  private loadNames(sales: SaleOrder[]) {
    const headquarterIds = [
      ...new Set(sales.map((sale) => sale.headquarterId)),
    ];

    const petRequests = headquarterIds.map((headquarterId) =>
      this.petService.getByHeadquarter({ headquarterId }),
    );

    const petsRequest =
      petRequests.length > 0
        ? forkJoin(petRequests).pipe(
          map((groups) => groups.flat()),
        )
        : of([] as Pet[]);

    return forkJoin({
      tutors: this.tutorService.list(),
      persons: this.personService.byIdStrict(),
      pets: petsRequest,
    }).pipe(
      map(({ tutors, persons, pets }) => {
        const clientNames = new Map<string, string>();

        for (const tutor of tutors) {
          const person = persons.get(tutor.person);

          if (person) {
            clientNames.set(
              tutor.id,
              `${person.firstName} ${person.lastName}`.trim(),
            );
          }
        }

        const petNames = new Map<string, string>();

        for (const pet of pets) {
          petNames.set(pet.id, pet.name);
        }

        return { clientNames, petNames };
      }),
    );
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  protected clientName(id: string): string {
    if (this.namesLoading()) {
      return 'Cargando...';
    }

    return this.clientNames().get(id) ?? 'Tutor no disponible';
  }

  protected petName(id: string): string {
    if (this.namesLoading()) {
      return 'Cargando...';
    }

    return this.petNames().get(id) ?? 'Mascota no disponible';
  }

  protected newSale(): void {
    if (!this.session.headquarterId()) {
      this.toast.info(
        'Selecciona una sede antes de crear una venta.',
      );
      return;
    }

    const ref = this.modal.open(SaleForm, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    ref.result.then(
      (sale: SaleOrder) => {
        this.toast.success(
          `Orden ${sale.orderNumber} creada correctamente`,
        );

        // La orden ya existe en el backend.
        // Vamos directamente al detalle para agregar ítems.
        void this.router.navigate(
          ['/ventas', sale.id],
          {
            queryParams: { addItem: '1' },
          },
        );
      },
      () => undefined,
    );
  }

  protected setStatus(value: string): void {
    this.status.set(value as SaleOrderState | '');
  }
}
