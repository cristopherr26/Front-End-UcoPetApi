import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { SessionService } from '../../services/session/session.service';
import { clearCookies, setSessionCookies } from '../../utils/session/testing';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    clearCookies();
    setSessionCookies('abc', ['ADMIN']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends the token to every API route, with or without v1', () => {
    ['/api/v1/products', '/api/invoices', '/api/transfers/1', '/api/notifications'].forEach(
      (url) => {
        http.get(url).subscribe();
        expect(backend.expectOne(url).request.headers.get('Authorization')).toBe('Bearer abc');
      },
    );
  });

  it('does not send the token outside the API', () => {
    http.get('https://fonts.googleapis.com/css2').subscribe();
    expect(
      backend.expectOne('https://fonts.googleapis.com/css2').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('closes the session and goes to login on a 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get('/api/invoices').subscribe({ error: () => undefined });
    backend.expectOne('/api/invoices').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(SessionService).isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('keeps the session on a 403, which is a missing permission', () => {
    http.get('/api/invoices').subscribe({ error: () => undefined });
    backend.expectOne('/api/invoices').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(SessionService).isLoggedIn()).toBe(true);
  });
});
