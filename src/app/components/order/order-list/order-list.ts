import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { catchError, of } from 'rxjs';

import { SessionService } from '../../../services/session/session.service';
import { OrderService } from '../../../services/order/order.service';
import { OrderDialogs } from '../../../services/order/order-dialogs.service';
import { ProcedureService } from '../../../services/procedure/procedure.service';
import { PetService } from '../../../services/pet/pet.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';

import { ORDER_STATES, Order, OrderState } from '../../../models/order/order.model';
import { Procedure } from '../../../models/procedure/procedure.model';
import { Pet } from '../../../models/pet/pet.model';
import { PersonSummary } from '../../../models/person/person.model';

import { SortHeader } from '../../../directives/shared/sort-header';
import { TablePager } from '../../shared/table-pager';

import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';

import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';

type StatusFilter = OrderState | 'ALL';

@Component({
  selector: 'app-order-list',
  imports: [SortHeader, TablePager, DatePipe],
  templateUrl: './order-list.html',
})
export class OrderList {
  private readonly dialogs = inject(OrderDialogs);

  private readonly orderService = inject(OrderService);

  private readonly procedureService = inject(ProcedureService);

  private readonly petService = inject(PetService);

  private readonly personLookup = inject(PersonLookupService);

  private readonly toast = inject(ToastService);

  private readonly confirm = injectConfirm();

  protected readonly session = inject(SessionService);

  protected readonly states = ORDER_STATES;

  // Filtros
  protected readonly search = signal('');

  protected readonly status = signal<StatusFilter>('ALL');

  // Todas las órdenes que devolvió el backend
  private readonly all = signal<Order[]>([]);

  // Las que quedan después de aplicar filtro y búsqueda (las que ve la tabla)
  protected readonly visible = signal<Order[]>([]);

  // Datos de referencia para mostrar nombres en lugar de UUID
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());

  private readonly procedures = signal<Procedure[]>([]);

  private readonly pets = signal<Pet[]>([]);

  // Estados de la consulta
  protected readonly loading = signal(false);

  protected readonly error = signal<string | null>(null);

  // Permite recargar la tabla después de una operación
  private readonly refresh = signal(0);

  // Tabla y ordenamiento (más recientes primero)
  protected readonly table = createTableState(this.visible, {
    sortKey: 'idOrder',
    direction: 'desc',
    accessors: {
      idOrder: (order) => order.idOrder,
      date: (order) => order.date,
      pet: (order) => this.petLabel(order.petId),
      tutor: (order) => this.tutorLabel(order.tutorId),
      procedure: (order) => this.procedureLabel(order.procedureId),
      state: (order) => order.state,
    },
  });

  constructor() {
    // Personas y procedimientos (incluye desactivados) se consultan una sola vez
    this.personLookup.byId().subscribe((persons) => this.persons.set(persons));

    this.procedureService
      .getAll()
      .pipe(catchError(() => of([] as Procedure[])))
      .subscribe((procedures) => this.procedures.set(procedures));

    // Las mascotas dependen de la sede activa: sin sede no se pueden consultar
    effect((onCleanup) => {
      const headquarterId = this.session.headquarterId();

      if (headquarterId === null) {
        this.pets.set([]);
        return;
      }

      const subscription = this.petService
        .getByHeadquarter({ headquarterId })
        .pipe(catchError(() => of([] as Pet[])))
        .subscribe((pets) => this.pets.set(pets));

      onCleanup(() => subscription.unsubscribe());
    });

    // Cada vez que cambie la señal de actualización se vuelve a consultar el backend
    effect((onCleanup) => {
      this.refresh();

      this.loading.set(true);

      this.error.set(null);

      const subscription = this.orderService.list().subscribe({
        next: (orders) => {
          this.all.set(orders);

          this.loading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.all.set([]);

          this.loading.set(false);

          this.error.set(apiErrorMessage(error, 'No se pudieron cargar las órdenes'));
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });

    // Cada vez que cambie el filtro, la búsqueda o los datos, se filtra en pantalla
    effect(() => {
      const text = this.search().trim().toLowerCase();

      const status = this.status();

      const rows = this.all().filter((order) => status === 'ALL' || order.state === status);

      if (!text) {
        this.visible.set(rows);
        return;
      }

      this.visible.set(
        rows.filter((order) =>
          [
            String(order.idOrder),
            this.petLabel(order.petId),
            this.tutorLabel(order.tutorId),
            this.procedureLabel(order.procedureId),
          ].some((value) => value.toLowerCase().includes(text)),
        ),
      );
    });
  }

  // Cambiar el filtro de estado
  protected setStatus(value: string): void {
    this.status.set(value as StatusFilter);
  }

  // Etiquetas legibles a partir de los ids
  protected tutorLabel(personId: string): string {
    const person = this.persons().get(personId);

    return person ? `${person.firstName} ${person.lastName}` : shortId(personId);
  }

  protected petLabel(petId: string): string {
    return this.pets().find((pet) => pet.id === petId)?.name ?? shortId(petId);
  }

  protected procedureLabel(procedureId: string): string {
    const procedure = this.procedures().find((item) => item.id === procedureId);

    return procedure ? `${procedure.code} — ${procedure.type}` : shortId(procedureId);
  }

  protected stateLabel(state: OrderState): string {
    return this.states.find((item) => item.value === state)?.label ?? state;
  }

  protected stateTag(state: OrderState): string {
    return this.states.find((item) => item.value === state)?.tag ?? 'is-neutral';
  }

  // Abrir formulario de creación
  protected create(): void {
    this.dialogs.order().subscribe((order) => {
      this.toast.success(`Orden #${order.idOrder} enviada al procesador de salud`);

      this.reload();
    });
  }

  // Cambiar el procedimiento (solo PENDING)
  protected changeProcedure(order: Order): void {
    this.dialogs.procedure(order).subscribe((updated) => {
      this.toast.success(
        `Procedimiento de la orden #${updated.idOrder} actualizado y enviado al procesador de salud`,
      );

      this.reload();
    });
  }

  // Autorizar o denegar (solo ADMIN y PENDING)
  protected authorize(order: Order, isAuthorized: boolean): void {
    const action = isAuthorized ? 'Autorizar' : 'Denegar';

    this.confirm(
      `${action} orden`,
      `¿Deseas ${action.toLowerCase()} la orden #${order.idOrder}? Esta decisión no se puede cambiar.`,
      action,
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.orderService.authorize(order.id, isAuthorized).subscribe({
        next: (updated) => {
          this.toast.success(
            `Orden #${updated.idOrder} ${isAuthorized ? 'autorizada' : 'denegada'} y enviada al procesador de salud`,
          );

          this.reload();
        },

        error: (error: HttpErrorResponse) => {
          this.toast.error(apiErrorMessage(error, 'No se pudo procesar la autorización'));
        },
      });
    });
  }

  // Eliminar (solo ADMIN y PENDING)
  protected remove(order: Order): void {
    this.confirm(
      'Eliminar orden',
      `¿Estás seguro de que deseas eliminar la orden #${order.idOrder}?`,
      'Eliminar',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.orderService.delete(order.id).subscribe({
        next: () => {
          this.toast.success(`Orden #${order.idOrder} eliminada`);

          this.reload();
        },

        error: (error: HttpErrorResponse) => {
          this.toast.error(apiErrorMessage(error, 'No se pudo eliminar la orden'));
        },
      });
    });
  }

  // El backend responde de forma síncrona con la orden ya guardada,
  // así que se puede volver a consultar de inmediato
  private reload(): void {
    this.refresh.update((value) => value + 1);
  }
}

function shortId(id: string): string {
  return id ? `${id.slice(0, 8)}…` : '—';
}
