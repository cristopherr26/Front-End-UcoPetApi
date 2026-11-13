import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';

import { Invoice } from '../../models/invoice/invoice.model';
import { InvoiceStatePipe } from '../../pipes/invoice/invoice-state.pipe';
import {
  canCancel,
  canRegisterPayment,
  dateRangeRule,
  invoiceErrorMessage,
  matchesText,
  paymentAmountRules,
  toApiFilters,
} from './form-rules';

const base: Invoice = {
  id: 'i1',
  saleOrderId: 's1',
  invoiceNumber: 'FAC-0001',
  headquarterId: 'h1',
  clientID: 'c1',
  petId: 'p1',
  issueDate: '2026-11-04T10:00:00',
  total: 100000,
  paidAmount: 40000,
  balance: 60000,
  observations: null,
  state: 'PARCIALMENTE_PAGADA',
};

describe('invoice form rules', () => {
  const amount = (value: number | string | null) =>
    new FormControl(value, paymentAmountRules(base.balance)).errors;

  it('requires a payment greater than zero', () => {
    expect(amount(null)).toEqual(expect.objectContaining({ required: true }));
    expect(amount(0)).toEqual(expect.objectContaining({ min: expect.anything() }));
  });

  it('does not accept a payment above the balance, like the API', () => {
    expect(amount(60000)).toBeNull();
    expect(amount(60000.01)).toEqual(expect.objectContaining({ maxAmount: expect.anything() }));
  });

  it('accepts up to 2 decimals', () => {
    expect(amount(100.5)).toBeNull();
    expect(amount('100.555')).toEqual(expect.objectContaining({ pattern: expect.anything() }));
  });

  it('rejects a date range where "from" is after "to"', () => {
    const group = (from: string, to: string) =>
      new FormGroup(
        { dateFrom: new FormControl(from), dateTo: new FormControl(to) },
        { validators: dateRangeRule },
      ).errors;
    expect(group('2026-11-05', '2026-11-01')).toEqual({ dateRange: true });
    expect(group('2026-11-01', '2026-11-05')).toBeNull();
    expect(group('2026-11-01', '')).toBeNull();
  });

  it('allows payments only with balance and not cancelled or paid', () => {
    expect(canRegisterPayment(base)).toBe(true);
    expect(canRegisterPayment({ ...base, state: 'PAGADA', balance: 0 })).toBe(false);
    expect(canRegisterPayment({ ...base, state: 'ANULADA' })).toBe(false);
  });

  it('allows cancelling anything that is not already cancelled', () => {
    expect(canCancel(base)).toBe(true);
    expect(canCancel({ ...base, state: 'PAGADA' })).toBe(true);
    expect(canCancel({ ...base, state: 'ANULADA' })).toBe(false);
  });

  it('builds API filters without the free text and with null for empty dates', () => {
    expect(
      toApiFilters({ state: 'PAGADA', dateFrom: '2026-11-01', dateTo: '', text: 'x' }, 'h1'),
    ).toEqual({ headquarterId: 'h1', state: 'PAGADA', dateFrom: '2026-11-01', dateTo: null });
  });

  it('searches by invoice number or client name, ignoring case', () => {
    expect(matchesText(base, 'fac-0001', null)).toBe(true);
    expect(matchesText(base, 'ana', 'Ana Ruiz')).toBe(true);
    expect(matchesText(base, 'zzz', 'Ana Ruiz')).toBe(false);
    expect(matchesText(base, '  ', null)).toBe(true);
  });

  it('keeps the invoice 503 message from the API', () => {
    const unavailable = new HttpErrorResponse({
      status: 503,
      error: { message: 'El servicio de facturación no está disponible' },
    });
    expect(invoiceErrorMessage(unavailable, 'x')).toBe(
      'El servicio de facturación no está disponible',
    );
    const conflict = new HttpErrorResponse({ status: 409, error: { message: 'Ya está ANULADA' } });
    expect(invoiceErrorMessage(conflict, 'x')).toBe('Ya está ANULADA');
  });

  it('shows the state in Spanish', () => {
    const pipe = new InvoiceStatePipe();
    expect(pipe.transform('PARCIALMENTE_PAGADA')).toBe('Pago parcial');
    expect(pipe.transform('ANULADA')).toBe('Anulada');
  });
});
