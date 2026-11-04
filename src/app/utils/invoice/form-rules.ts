import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { Invoice, InvoiceFilters } from '../../models/invoice/invoice.model';
import { InvoiceState } from '../../models/invoice/invoice-enums';
import { apiErrorMessage } from '../shared/api-error';

// Mismos límites que la API: observations es VARCHAR(255) y los montos llevan hasta 2 decimales.
export const OBSERVATIONS_MAX = 255;
export const SEARCH_TEXT_MAX = 100;
const AMOUNT_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

// Tiempo que se le da al procesador de pagos antes de volver a consultar (las escrituras son asíncronas).
export const PROCESSOR_DELAY_MS = 1500;

export interface InvoiceFilterForm {
  state: InvoiceState | null;
  dateFrom: string;
  dateTo: string;
  text: string;
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilterForm = {
  state: null,
  dateFrom: '',
  dateTo: '',
  text: '',
};

// Valida el abono: obligatorio, mayor a cero, 2 decimales y sin pasar del saldo, como en registerPayment.
export function paymentAmountRules(balance: number): ValidatorFn[] {
  return [
    Validators.required,
    Validators.min(0.01),
    Validators.pattern(AMOUNT_PATTERN),
    maxAmount(balance),
  ];
}

export function maxAmount(limit: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Number(control.value);
    if (control.value === null || control.value === '' || Number.isNaN(value)) {
      return null;
    }
    return value > limit ? { maxAmount: { limit, actual: value } } : null;
  };
}

// Validador de grupo: "desde" no puede ser posterior a "hasta" (la API responde 400 si pasa).
export const dateRangeRule: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const from = group.get('dateFrom')?.value as string | null;
  const to = group.get('dateTo')?.value as string | null;
  return from && to && from > to ? { dateRange: true } : null;
};

export function canRegisterPayment(invoice: Invoice): boolean {
  return invoice.state !== 'ANULADA' && invoice.state !== 'PAGADA' && invoice.balance > 0;
}

export function canCancel(invoice: Invoice): boolean {
  return invoice.state !== 'ANULADA';
}

// Lo que se manda a la API como filtro. El texto se filtra en el navegador (la API compara exacto).
export function toApiFilters(
  form: InvoiceFilterForm,
  headquarterId: string | null,
): InvoiceFilters {
  return {
    headquarterId,
    state: form.state,
    dateFrom: form.dateFrom || null,
    dateTo: form.dateTo || null,
  };
}

export function matchesText(invoice: Invoice, term: string, clientName: string | null): boolean {
  const normalized = term.trim().toLowerCase();
  return (
    normalized === '' ||
    invoice.invoiceNumber.toLowerCase().includes(normalized) ||
    (clientName ?? '').toLowerCase().includes(normalized)
  );
}

export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

// El 503 de Facturas trae su propio mensaje ("El servicio de facturación no está disponible...").
export function invoiceErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 503 && error.error?.message) {
    return error.error.message;
  }
  return apiErrorMessage(error, fallback);
}
