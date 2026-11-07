import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, catchError, forkJoin, from, of } from 'rxjs';

import { PageHeader } from '../../shared/page-header';
import { KpiCard } from '../../shared/kpi-card';
import { TablePager } from '../../shared/table-pager';
import { SortHeader } from '../../../directives/shared/sort-header';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { createTableState } from '../../../utils/shared/table-state';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import {
  PayMethod,
  PetOption,
  RECEIPT_STATES,
  Receipt,
  ReceiptRequest,
  ReceiptState,
  TutorOption,
} from '../../../models/receipts/receipt.model';
import { PayMethodService } from '../../../services/receipts/pay-method.service';
import { ReceiptReferenceService } from '../../../services/receipts/receipt-reference.service';
import { ReceiptService } from '../../../services/receipts/receipt.service';
import { ReceiptForm } from '../receipt-form/receipt-form';

// El processor guarda un instante después del 202: se vuelve a leer la lista dos veces.
const REFRESH_DELAYS_MS = [1500, 4000];

@Component({
  selector: 'app-receipts-list',
  imports: [DatePipe, PageHeader, KpiCard, TablePager, SortHeader, PricePipe],
  templateUrl: './receipts-list.html',
  styleUrl: './receipts-list.scss',
})
export class ReceiptsList implements OnInit {
  private readonly receiptService = inject(ReceiptService);
  private readonly payMethodService = inject(PayMethodService);
  private readonly referenceService = inject(ReceiptReferenceService);
  private readonly modalService = inject(NgbModal);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  protected readonly states = RECEIPT_STATES;

  protected readonly receipts = signal<Receipt[]>([]);
  protected readonly payMethods = signal<PayMethod[]>([]);
  protected readonly tutors = signal<TutorOption[]>([]);
  protected readonly pets = signal<PetOption[]>([]);
  protected readonly pendingIds = signal<ReadonlySet<string>>(new Set());
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly state = signal<ReceiptState | null>(null);
  protected readonly payMethodId = signal<string | null>(null);
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  private readonly tutorNames = computed(
    () => new Map(this.tutors().map((tutor) => [tutor.id, tutor.name])),
  );
  private readonly petNames = computed(
    () => new Map(this.pets().map((pet) => [pet.id, pet.name])),
  );

  protected readonly hasFilters = computed(
    () =>
      this.search() !== '' ||
      this.state() !== null ||
      this.payMethodId() !== null ||
      this.dateFrom() !== '' ||
      this.dateTo() !== '',
  );

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const state = this.state();
    const payMethodId = this.payMethodId();
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.receipts().filter(
      (receipt) =>
        (term === '' ||
          receipt.receiptNumber.toLowerCase().includes(term) ||
          receipt.concept.toLowerCase().includes(term) ||
          this.tutorName(receipt).toLowerCase().includes(term) ||
          (this.petName(receipt) ?? '').toLowerCase().includes(term)) &&
        (state === null || receipt.state === state) &&
        (payMethodId === null || receipt.payMethodId === payMethodId) &&
        (from === '' || receipt.date.slice(0, 10) >= from) &&
        (to === '' || receipt.date.slice(0, 10) <= to),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'date',
    direction: 'desc',
    accessors: {
      number: (receipt) => receipt.receiptNumber,
      concept: (receipt) => receipt.concept,
      payMethod: (receipt) => receipt.payMethodName,
      date: (receipt) => receipt.date,
      amount: (receipt) => receipt.amount,
      state: (receipt) => receipt.state,
    },
  });

  private readonly active = computed(() =>
    this.receipts().filter((receipt) => receipt.state === 'ACTIVE'),
  );
  private readonly today = computed(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    return this.active().filter((receipt) => receipt.date.slice(0, 10) === today);
  });

  protected readonly todayTotal = computed(() =>
    this.today().reduce((sum, receipt) => sum + receipt.amount, 0),
  );
  protected readonly todayCount = computed(() => this.today().length);
  protected readonly activeCount = computed(() => this.active().length);
  protected readonly cancelledCount = computed(
    () => this.receipts().filter((receipt) => receipt.state === 'CANCELLED').length,
  );
  protected readonly last = computed(
    () => [...this.receipts()].sort((a, b) => b.date.localeCompare(a.date)).at(0) ?? null,
  );
  protected readonly visibleTotal = computed(() =>
    this.visible()
      .filter((receipt) => receipt.state === 'ACTIVE')
      .reduce((sum, receipt) => sum + receipt.amount, 0),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  ngOnInit(): void {
    this.payMethodService.list().subscribe({
      next: (methods) => this.payMethods.set(methods),
      error: (error: HttpErrorResponse) =>
        this.toast.error(apiErrorMessage(error, 'No se pudieron cargar los métodos de pago')),
    });
    forkJoin({
      tutors: this.referenceService.tutors().pipe(catchError(() => of([] as TutorOption[]))),
      pets: this.referenceService.pets().pipe(catchError(() => of([] as PetOption[]))),
    }).subscribe(({ tutors, pets }) => {
      this.tutors.set(tutors);
      this.pets.set(pets);
    });
    this.load(false);
  }

  protected tutorName(receipt: Receipt): string {
    return this.tutorNames().get(receipt.tutorId) ?? 'Tutor sin nombre';
  }

  protected petName(receipt: Receipt): string | null {
    if (receipt.petId === null) {
      return null;
    }
    return this.petNames().get(receipt.petId) ?? 'Mascota sin nombre';
  }

  protected isPending(receipt: Receipt): boolean {
    return this.pendingIds().has(receipt.id);
  }

  protected setState(value: string): void {
    this.state.set(value === '' ? null : (value as ReceiptState));
  }

  protected setPayMethod(value: string): void {
    this.payMethodId.set(value === '' ? null : value);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.state.set(null);
    this.payMethodId.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  protected load(silent: boolean): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);
    this.receiptService.list().subscribe({
      next: (receipts) => {
        this.receipts.set(Array.isArray(receipts) ? receipts : []);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudieron cargar los recibos'));
      },
    });
  }

  protected create(): void {
    this.openForm(null).subscribe((request) => {
      this.receiptService.create(request).subscribe({
        next: () => {
          this.toast.info('El recibo se envió; el procesador de pagos lo registra en un momento');
          this.refreshAfterAsync(null);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo enviar el recibo')),
      });
    });
  }

  protected edit(receipt: Receipt): void {
    this.openForm(receipt).subscribe((request) => {
      this.receiptService.update(receipt.id, request).subscribe({
        next: () => {
          this.toast.info(`${receipt.receiptNumber} se envió a actualizar; el procesador lo aplica`);
          this.refreshAfterAsync(receipt.id);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo actualizar el recibo')),
      });
    });
  }

  protected cancel(receipt: Receipt): void {
    this.confirm(
      'Anular el recibo',
      `${receipt.receiptNumber} quedará anulado y ya no se podrá modificar. Los recibos no se eliminan.`,
      'Anular',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.receiptService.cancel(receipt.id).subscribe({
        next: () => {
          this.toast.info(`${receipt.receiptNumber} se envió a anular; el procesador lo aplica`);
          this.refreshAfterAsync(receipt.id);
        },
        error: (error: HttpErrorResponse) =>
          this.toast.error(apiErrorMessage(error, 'No se pudo anular el recibo')),
      });
    });
  }

  private openForm(receipt: Receipt | null) {
    const ref = this.modalService.open(ReceiptForm, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    });
    ref.componentInstance.start(this.payMethods(), this.tutors(), this.pets(), receipt);
    return from(ref.result as Promise<ReceiptRequest>).pipe(catchError(() => EMPTY));
  }

  /** Tras un 202 el recibo aún no está guardado: se marca "Procesando" y se relee la lista. */
  private refreshAfterAsync(id: string | null): void {
    if (id !== null) {
      this.pendingIds.update((ids) => new Set(ids).add(id));
    }
    REFRESH_DELAYS_MS.forEach((delay, index) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.load(true);
        if (id !== null && index === REFRESH_DELAYS_MS.length - 1) {
          this.pendingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
        }
      }, delay);
      this.timers.add(timer);
    });
  }
}
