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

  it('keeps the token, the profile and the headquarter after a reload', () => {
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
    expect(reloaded.token()).toBe('t1');
    expect(reloaded.profile()?.fullName).toBe('Ana Prueba');
    expect(reloaded.isAdmin()).toBe(false);
    expect(reloaded.headquarterId()).toBe('hq-1');
  });

  it('forgets everything on clear', () => {
    document.cookie = 'ucopet_token=t1; Path=/';
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
});
