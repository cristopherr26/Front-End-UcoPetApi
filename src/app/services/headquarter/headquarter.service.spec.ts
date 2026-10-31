import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SessionService } from '../session/session.service';
import { clearCookies, setSessionCookies } from '../../utils/session/testing';
import { HeadquarterService } from './headquarter.service';

describe('HeadquarterService', () => {
  let service: HeadquarterService;
  let backend: HttpTestingController;
  const sede = { id: 'h1', name: 'Norte', address: 'Calle 1', isActive: true };

  beforeEach(() => {
    clearCookies();
    setSessionCookies('t', ['ADMIN']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HeadquarterService);
    backend = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => backend.verify());

  it('asks the API once and shares the answer', () => {
    const seen: number[] = [];
    service.list().subscribe((list) => seen.push(list.length));
    service.list().subscribe((list) => seen.push(list.length));
    backend.expectOne('/api/v1/headquarter').flush([sede]);
    service.list().subscribe((list) => seen.push(list.length));
    expect(seen).toEqual([1, 1, 1]);
  });

  it('asks again after refresh, after an error and after the session changes', () => {
    service.list().subscribe();
    backend.expectOne('/api/v1/headquarter').flush([sede]);
    service.refresh();
    service.list().subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/headquarter').flush(null, { status: 500, statusText: 'Error' });
    service.list().subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/headquarter').flush([sede]);
    TestBed.inject(SessionService).clear();
    TestBed.tick();
    service.list().subscribe();
    backend.expectOne('/api/v1/headquarter').flush([]);
  });
});
