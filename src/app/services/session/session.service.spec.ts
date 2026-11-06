import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SessionService } from './session.service';
import { clearCookies } from '../../utils/session/testing';

describe('SessionService', () => {
  beforeEach(() => {
    clearCookies();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('keeps the profile and the headquarter after a reload', () => {
    const session = TestBed.inject(SessionService);
    session.login('ana@ucopet.com', 'secreta').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/persons/login')
      .flush({ token: 't1', personId: 'p1', fullName: 'Ana Prueba', roles: ['DOCTOR'] });
    session.selectHeadquarter('hq-1');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const reloaded = TestBed.inject(SessionService);
    expect(reloaded.isLoggedIn()).toBe(true);
    expect(reloaded.profile()?.fullName).toBe('Ana Prueba');
    expect(reloaded.isAdmin()).toBe(false);
    expect(reloaded.headquarterId()).toBe('hq-1');
  });

  it('never stores the token where JavaScript can read it', () => {
    const session = TestBed.inject(SessionService);
    session.login('ana@ucopet.com', 'secreta').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/persons/login')
      .flush({ token: 'secreto-jwt', personId: 'p1', fullName: 'Ana Prueba', roles: ['ADMIN'] });
    expect(document.cookie).not.toContain('secreto-jwt');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('deletes the token cookie left by the provisional login', () => {
    document.cookie = 'ucopet_token=viejo; Path=/';
    TestBed.inject(SessionService);
    expect(document.cookie).not.toContain('ucopet_token');
  });

  it('logs out in the API and forgets everything locally', () => {
    const session = TestBed.inject(SessionService);
    session.login('ana@ucopet.com', 'secreta').subscribe();
    const backend = TestBed.inject(HttpTestingController);
    backend
      .expectOne('/api/v1/persons/login')
      .flush({ token: 't1', personId: 'p1', fullName: 'Ana Prueba', roles: ['ADMIN'] });
    session.logout();
    backend.expectOne('/api/v1/persons/logout').flush(null);
    expect(session.isLoggedIn()).toBe(false);
  });

  it('forgets everything on clear', () => {
    document.cookie = 'ucopet_profile=x; Path=/';
    document.cookie = 'ucopet_headquarter=hq-1; Path=/';
    const session = TestBed.inject(SessionService);
    session.clear();
    expect(session.isLoggedIn()).toBe(false);
    expect(session.headquarterId()).toBeNull();
    expect(document.cookie).not.toContain('ucopet_');
  });

  it('ignores a damaged profile cookie', () => {
    document.cookie = 'ucopet_profile=no-es-json; Path=/';
    expect(TestBed.inject(SessionService).profile()).toBeNull();
  });

  it('updates the name shown after editing my account', () => {
    document.cookie = `ucopet_profile=${encodeURIComponent(JSON.stringify({ personId: 'p1', fullName: 'Ana Prueba', roles: ['ADMIN'] }))}; Path=/`;
    const session = TestBed.inject(SessionService);
    session.updateFullName('Ana María Prueba');
    expect(session.profile()?.fullName).toBe('Ana María Prueba');
  });
});
