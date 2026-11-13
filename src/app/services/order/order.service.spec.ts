import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { OrderService } from './order.service';
import { CreateOrderRequest, Order } from '../../models/order/order.model';

describe('OrderService', () => {
  let service: OrderService;
  let backend: HttpTestingController;
  const order: Order = {
    id: 'o1',
    idOrder: 7,
    tutorId: 'person1',
    petId: 'pet1',
    procedureId: 'proc1',
    state: 'PENDING',
    date: '2026-11-10T09:30:00',
    isAuthorized: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lists and reads orders by ID', () => {
    service.list().subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/orders' }).flush([order]);

    service.getById('o1').subscribe();
    backend.expectOne({ method: 'GET', url: '/api/v1/orders/o1' }).flush(order);
  });

  it('creates with POST sending only tutorId, petId and procedureId', () => {
    // Aunque llegue un objeto con campos de más, el cuerpo solo lleva los tres ids
    const withExtras = {
      ...order,
    } as unknown as CreateOrderRequest;

    service.create(withExtras).subscribe();
    const request = backend.expectOne({ method: 'POST', url: '/api/v1/orders' });

    expect(request.request.body).toEqual({
      tutorId: 'person1',
      petId: 'pet1',
      procedureId: 'proc1',
    });
    expect(request.request.body).not.toHaveProperty('id');
    expect(request.request.body).not.toHaveProperty('state');
    expect(request.request.body).not.toHaveProperty('date');
    expect(request.request.body).not.toHaveProperty('isAuthorized');
    request.flush(order, { status: 201, statusText: 'Created' });
  });

  it('changes the procedure with PATCH and only the new procedureId', () => {
    service.changeProcedure('o1', 'proc2').subscribe();
    const request = backend.expectOne({ method: 'PATCH', url: '/api/v1/orders/o1/procedure' });

    expect(request.request.body).toEqual({ procedureId: 'proc2' });
    request.flush({ ...order, procedureId: 'proc2' });
  });

  it('always sends isAuthorized explicitly when authorizing or denying', () => {
    service.authorize('o1', true).subscribe();
    const approve = backend.expectOne({ method: 'PATCH', url: '/api/v1/orders/o1/authorize' });
    expect(approve.request.body).toEqual({ isAuthorized: true });
    approve.flush({ ...order, state: 'AUTHORIZED', isAuthorized: true });

    service.authorize('o1', false).subscribe();
    const deny = backend.expectOne({ method: 'PATCH', url: '/api/v1/orders/o1/authorize' });
    expect(deny.request.body).toEqual({ isAuthorized: false });
    deny.flush({ ...order, state: 'DENIED' });
  });

  it('deletes with DELETE and no body', () => {
    service.delete('o1').subscribe();
    const request = backend.expectOne({ method: 'DELETE', url: '/api/v1/orders/o1' });

    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
