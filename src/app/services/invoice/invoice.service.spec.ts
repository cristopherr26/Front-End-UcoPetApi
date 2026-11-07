import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InvoiceService } from './invoice.service';
import { InvoiceReferenceService } from './invoice-reference.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let references: InvoiceReferenceService;
  let backend: HttpTestingController;
  const accepted = { invoiceId: 'i1', idMessage: 'm1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvoiceService);
    references = TestBed.inject(InvoiceReferenceService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists from /api/invoices (without v1) and only sends the filters that have a value', () => {
    service
      .list({ headquarterId: 'h1', state: 'PENDIENTE', dateFrom: '2026-01-01', dateTo: null })
      .subscribe();
    const request = backend.expectOne((req) => req.url === '/api/invoices');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('headquarterId')).toBe('h1');
    expect(request.request.params.get('state')).toBe('PENDIENTE');
    expect(request.request.params.get('dateFrom')).toBe('2026-01-01');
    expect(request.request.params.has('dateTo')).toBe(false);
    request.flush([]);
  });

  it('gets one invoice by id', () => {
    service.getById('i1').subscribe();
    expect(backend.expectOne('/api/invoices/i1').request.method).toBe('GET');
  });

  it('creates with POST and the sale order in the body', () => {
    let result: unknown;
    service.create({ saleOrderId: 's1', observations: null }).subscribe((r) => (result = r));
    const request = backend.expectOne('/api/invoices');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ saleOrderId: 's1', observations: null });
    request.flush(accepted, { status: 202, statusText: 'Accepted' });
    expect(result).toEqual(accepted);
  });

  it('registers a payment and cancels with PUT', () => {
    service.registerPayment('i1', { amount: 5000 }).subscribe();
    const payment = backend.expectOne('/api/invoices/i1/payments');
    expect(payment.request.method).toBe('PUT');
    expect(payment.request.body).toEqual({ amount: 5000 });
    payment.flush(accepted);

    service.cancel('i1').subscribe();
    expect(backend.expectOne('/api/invoices/i1/cancel').request.method).toBe('PUT');
  });

  it('asks only for draft sale orders to bill', () => {
    references.billableSaleOrders('h1').subscribe();
    const request = backend.expectOne((req) => req.url === '/api/v1/sales');
    expect(request.request.params.get('state')).toBe('BORRADOR');
    expect(request.request.params.get('headquarterId')).toBe('h1');
    request.flush([]);
  });
});
