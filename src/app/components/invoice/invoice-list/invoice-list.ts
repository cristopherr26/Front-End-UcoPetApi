import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import { PageHeader } from '../../shared/page-header';
import { KpiCard } from '../../shared/kpi-card';
import { TablePager } from '../../shared/table-pager';
import { SortHeader } from '../../../directives/shared/sort-header';
import { createTableState } from '../../../utils/shared/table-state';
import { Invoice } from '../../../models/invoice/invoice.model';
import {
  INVOICE_STATES,
  INVOICE_STATE_TONES,
  InvoiceState,
} from '../../../models/invoice/invoice-enums';
import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { PersonSummary } from '../../../models/person/person.model';
import { InvoiceService } from '../../../services/invoice/invoice.service';
import { InvoiceDialogs } from '../../../services/invoice/invoice-dialogs.service';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { PersonLookupService } from '../../../services/person/person-lookup.service';
import { SessionService } from '../../../services/session/session.service';
import { injectConfirm } from '../../../services/shared/confirm';
import { ToastService } from '../../../services/shared/toast.service';
import { PricePipe } from '../../../pipes/shared/price.pipe';
import { InvoiceStatePipe } from '../../../pipes/invoice/invoice-state.pipe';
import { personName, shortId } from '../../../utils/doctor/form-rules';
import {
  DEFAULT_INVOICE_FILTERS,
  PROCESSOR_DELAY_MS,
  SEARCH_TEXT_MAX,
  canCancel,
  canRegisterPayment,
  dateRangeRule,
  invoiceErrorMessage,
  matchesText,
  toApiFilters,
} from '../../../utils/invoice/form-rules';

@Component({
  selector: 'app-invoice-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    UpperCasePipe,
    PricePipe,
    InvoiceStatePipe,
    PageHeader,
    KpiCard,
    SortHeader,
    TablePager,
  ],
  templateUrl: './invoice-list.html',
  styles: `
    .date-input {
      width: 10.5rem;
      flex: 0 0 auto;
    }
  `,
})
export class InvoiceList {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialogs = inject(InvoiceDialogs);
  private readonly personLookup = inject(PersonLookupService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly session = inject(SessionService);

  protected readonly states = INVOICE_STATES;
  protected readonly tones = INVOICE_STATE_TONES;
  protected readonly textMax = SEARCH_TEXT_MAX;

  protected readonly form = this.fb.group(
    {
      state: this.fb.control<InvoiceState | null>(null),
      dateFrom: [''],
      dateTo: [''],
      text: ['', Validators.maxLength(this.textMax)],
    },
    { validators: dateRangeRule },
  );
  private readonly filters = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  private readonly formValid = toSignal(this.form.statusChanges.pipe(map((s) => s === 'VALID')), {
    initialValue: true,
  });

  protected readonly invoices = signal<Invoice[]>([]);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  private readonly headquarters = signal<Headquarter[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly refresh = signal(0);

  // Solo cambia cuando cambian los filtros que van a la API; el texto no dispara otra consulta.
  private readonly apiFilters = computed(
    () => {
      const { state, dateFrom, dateTo } = this.filters();
      return this.formValid()
        ? toApiFilters({ state, dateFrom, dateTo, text: '' }, this.session.headquarterId())
        : null;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  protected readonly visible = computed(() => {
    const term = this.filters().text;
    return this.invoices().filter((invoice) =>
      matchesText(invoice, term, this.clientName(invoice)),
    );
  });

  protected readonly table = createTableState(this.visible, {
    sortKey: 'issueDate',
    direction: 'desc',
    accessors: {
      number: (invoice) => invoice.invoiceNumber,
      issueDate: (invoice) => Date.parse(invoice.issueDate),
      client: (invoice) => this.clientName(invoice) ?? invoice.clientID,
      total: (invoice) => invoice.total,
      balance: (invoice) => invoice.balance,
      state: (invoice) => invoice.state,
    },
  });

  // Indicadores sobre lo que se ve en la tabla; las anuladas no suman al dinero.
  private readonly valid = computed(() => this.visible().filter((i) => i.state !== 'ANULADA'));
  protected readonly billed = computed(() => this.sum(this.valid(), (i) => i.total));
  protected readonly receivable = computed(() => this.sum(this.valid(), (i) => i.balance));
  protected readonly collected = computed(() => this.sum(this.valid(), (i) => i.paidAmount));
  protected readonly openCount = computed(
    () => this.valid().filter((invoice) => invoice.balance > 0).length,
  );
  protected readonly scope = computed(() =>
    this.session.headquarterId() ? 'Sede activa' : 'Toda la clínica',
  );

  protected readonly shortId = shortId;
  protected readonly canRegisterPayment = canRegisterPayment;
  protected readonly canCancel = canCancel;

  constructor() {
    this.headquarterService.list().subscribe({
      next: (headquarters) => this.headquarters.set(headquarters),
      error: () => this.headquarters.set([]),
    });

    effect((onCleanup) => {
      this.refresh();
      const filters = this.apiFilters();
      if (filters === null) {
        return;
      }
      this.loading.set(untracked(() => this.invoices().length === 0));
      this.error.set(null);
      const subscription = forkJoin({
        invoices: this.invoiceService.list(filters),
        persons: this.personLookup.byId(),
      }).subscribe({
        next: ({ invoices, persons }) => {
          this.invoices.set(invoices);
          this.persons.set(persons);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.invoices.set([]);
          this.loading.set(false);
          this.error.set(invoiceErrorMessage(error, 'No se pudieron cargar las facturas'));
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected clientName(invoice: Invoice): string | null {
    return personName(this.persons().get(invoice.clientID));
  }

  protected headquarterName(headquarterId: string): string {
    return this.headquarters().find((item) => item.id === headquarterId)?.name ?? 'Sede';
  }

  protected reload(): void {
    this.refresh.update((value) => value + 1);
  }

  protected clearFilters(): void {
    this.form.reset(DEFAULT_INVOICE_FILTERS);
  }

  protected rangeInvalid(): boolean {
    return this.form.hasError('dateRange');
  }

  protected create(): void {
    this.dialogs.create().subscribe(() => this.afterWrite('La factura se envió a crear'));
  }

  protected registerPayment(invoice: Invoice): void {
    this.dialogs
      .registerPayment(invoice)
      .subscribe(() => this.afterWrite(`El pago de ${invoice.invoiceNumber} se envió`));
  }

  protected cancel(invoice: Invoice): void {
    this.confirm(
      'Anular la factura',
      `La factura ${invoice.invoiceNumber} quedará anulada y no admitirá más pagos.`,
      'Anular',
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.invoiceService.cancel(invoice.id).subscribe({
        next: () => this.afterWrite(`La factura ${invoice.invoiceNumber} se envió a anular`),
        error: (error: HttpErrorResponse) =>
          this.toast.error(invoiceErrorMessage(error, 'No se pudo anular la factura')),
      });
    });
  }

  private afterWrite(message: string): void {
    this.toast.info(`${message}; el procesador de pagos lo aplica en un momento`);
    this.refreshSoon();
  }

  private refreshSoon(): void {
    setTimeout(() => this.reload(), PROCESSOR_DELAY_MS);
  }

  private sum(invoices: Invoice[], value: (invoice: Invoice) => number): number {
    return invoices.reduce((total, invoice) => total + value(invoice), 0);
  }
}
