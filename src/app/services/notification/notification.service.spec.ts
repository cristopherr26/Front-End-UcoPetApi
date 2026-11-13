import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SessionService } from '../session/session.service';
import { clearCookies, setSessionCookies } from '../../utils/session/testing';
import { NotificationService } from './notification.service';

const BASE = '/api/v1/notifications';

describe('NotificationService', () => {
  let service: NotificationService;
  let backend: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    clearCookies();
    setSessionCookies(['ADMIN']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    backend = TestBed.inject(HttpTestingController);
    TestBed.tick();
    vi.advanceTimersByTime(1);
    backend.expectOne(`${BASE}/person/p1/unread/count`).flush(3);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('loads the unread count at start and again every 30 seconds', () => {
    expect(service.unreadCount()).toBe(3);
    vi.advanceTimersByTime(30_000);
    backend.expectOne(`${BASE}/person/p1/unread/count`).flush(5);
    expect(service.unreadCount()).toBe(5);
  });

  it('keeps the last count when the API fails', () => {
    vi.advanceTimersByTime(30_000);
    backend
      .expectOne(`${BASE}/person/p1/unread/count`)
      .flush(null, { status: 500, statusText: 'Error' });
    expect(service.unreadCount()).toBe(3);
  });

  it('calls the right URL and method for each endpoint', () => {
    service.list('p1').subscribe();
    let request = backend.expectOne(`${BASE}/person/p1`);
    expect(request.request.method).toBe('GET');
    request.flush([]);

    service.listUnread('p1').subscribe();
    request = backend.expectOne(`${BASE}/person/p1/unread`);
    expect(request.request.method).toBe('GET');
    request.flush([]);

    service.markAsRead('n1').subscribe();
    request = backend.expectOne(`${BASE}/n1/read`);
    expect(request.request.method).toBe('PATCH');
    request.flush(null);

    service.markAllAsRead('p1').subscribe();
    request = backend.expectOne(`${BASE}/person/p1/read-all`);
    expect(request.request.method).toBe('PATCH');
    request.flush(null);

    service.delete('n1', false).subscribe();
    request = backend.expectOne(`${BASE}/n1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('adjusts the unread counter without asking the API again', () => {
    service.markAsRead('n1').subscribe();
    backend.expectOne(`${BASE}/n1/read`).flush(null);
    expect(service.unreadCount()).toBe(2);

    service.delete('n2', true).subscribe();
    backend.expectOne(`${BASE}/n2`).flush(null);
    expect(service.unreadCount()).toBe(1);

    service.delete('n3', false).subscribe();
    backend.expectOne(`${BASE}/n3`).flush(null);
    expect(service.unreadCount()).toBe(1);

    service.markAllAsRead('p1').subscribe();
    backend.expectOne(`${BASE}/person/p1/read-all`).flush(null);
    expect(service.unreadCount()).toBe(0);

    service.markAsRead('n4').subscribe();
    backend.expectOne(`${BASE}/n4/read`).flush(null);
    expect(service.unreadCount()).toBe(0);
  });

  it('goes back to zero and stops asking when the session ends', () => {
    TestBed.inject(SessionService).clear();
    TestBed.tick();
    expect(service.unreadCount()).toBe(0);
    vi.advanceTimersByTime(120_000);
    backend.expectNone(`${BASE}/person/p1/unread/count`);
  });
});
