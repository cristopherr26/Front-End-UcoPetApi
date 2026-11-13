import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { PageHeader } from '../../shared/page-header';
import { EmptyState } from '../../shared/empty-state';
import { Invoice } from '../../../models/invoice/invoice.model';
import { INVOICE_STATE_TONES } from '../../../models/invoice/invoice-enums';
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
  PROCESSOR_DELAY_MS,
  canCancel,
  canRegisterPayment,
  invoiceErrorMessage,
} from '../../../utils/invoice/form-rules';

@Component({
  selector: 'app-invoice-detail',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    UpperCasePipe,
    PricePipe,
    InvoiceStatePipe,
    PageHeader,
    EmptyState,
  ],
  templateUrl: './invoice-detail.html',
})
export class InvoiceDetail {
  private readonly invoiceService = inject(InvoiceService);
  private readonly dialogs = inject(InvoiceDialogs);
  private readonly personLookup = inject(PersonLookupService);
  private readonly headquarterService = inject(HeadquarterService);
  private readonly toast = inject(ToastService);
  private readonly confirm = injectConfirm();
  protected readonly session = inject(SessionService);

  // Llega desde la ruta /facturas/:id (withComponentInputBinding).
  readonly id = input.required<string>();

  protected readonly invoice = signal<Invoice | null>(null);
  private readonly persons = signal<Map<string, PersonSummary>>(new Map());
  private readonly headquarters = signal<Headquarter[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);
  private readonly refresh = signal(0);

  protected readonly tones = INVOICE_STATE_TONES;
  protected readonly shortId = shortId;

  protected readonly clientName = computed(() => {
    const invoice = this.invoice();
    return invoice ? personName(this.persons().get(invoice.clientID)) : null;
  });
  protected readonly headquarterName = computed(() => {
    const invoice = this.invoice();
    return this.headquarters().find((item) => item.id === invoice?.headquarterId)?.name ?? null;
  });
  protected readonly paidPercent = computed(() => {
    const invoice = this.invoice();
    return invoice && invoice.total > 0 ? (invoice.paidAmount / invoice.total) * 100 : 0;
  });
  protected readonly payable = computed(() => {
    const invoice = this.invoice();
    return invoice !== null && this.session.isAdmin() && canRegisterPayment(invoice);
  });
  protected readonly cancellable = computed(() => {
    const invoice = this.invoice();
    return invoice !== null && this.session.isAdmin() && canCancel(invoice);
  });

  constructor() {
    this.personLookup.byId().subscribe((persons) => this.persons.set(persons));
    this.headquarterService.list().subscribe({
      next: (headquarters) => this.headquarters.set(headquarters),
      error: () => this.headquarters.set([]),
    });

    effect((onCleanup) => {
      this.refresh();
      const id = this.id();
      this.error.set(null);
      this.notFound.set(false);
      const subscription = this.invoiceService.getById(id).subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.invoice.set(null);
          this.loading.set(false);
          if (error.status === 404 || error.status === 400) {
            this.notFound.set(true);
          } else {
            this.error.set(invoiceErrorMessage(error, 'No se pudo cargar la factura'));
          }
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected reload(): void {
    this.refresh.update((value) => value + 1);
  }

  protected registerPayment(invoice: Invoice): void {
    this.dialogs.registerPayment(invoice).subscribe(() => this.afterWrite('El pago se envió'));
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
        next: () => this.afterWrite('La anulación se envió'),
        error: (error: HttpErrorResponse) =>
          this.toast.error(invoiceErrorMessage(error, 'No se pudo anular la factura')),
      });
    });
  }

  private afterWrite(message: string): void {
    this.toast.info(`${message}; el procesador de pagos lo aplica en un momento`);
    setTimeout(() => this.reload(), PROCESSOR_DELAY_MS);
  }
}
