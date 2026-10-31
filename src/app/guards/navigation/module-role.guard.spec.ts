import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { clearCookies, setSessionCookies } from '../../utils/session/testing';
import { moduleRoleGuard } from './module-role.guard';

function canEnter(module: string): boolean | UrlTree {
  const route = { data: { module } } as unknown as ActivatedRouteSnapshot;
  return TestBed.runInInjectionContext(() => moduleRoleGuard(route, {} as RouterStateSnapshot)) as
    boolean | UrlTree;
}

describe('moduleRoleGuard', () => {
  function asRole(role: string): void {
    clearCookies();
    setSessionCookies('t', [role]);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  }

  it('lets a doctor into health and the catalog', () => {
    asRole('DOCTOR');
    expect(canEnter('agenda')).toBe(true);
    expect(canEnter('catalogo')).toBe(true);
  });

  it('sends a doctor from an admin module back to the start page', () => {
    asRole('DOCTOR');
    const result = canEnter('facturas');
    expect(result instanceof UrlTree && TestBed.inject(Router).serializeUrl(result)).toBe(
      '/inicio',
    );
  });

  it('lets an admin into every module', () => {
    asRole('ADMIN');
    ['facturas', 'usuarios', 'traslados', 'agenda'].forEach((module) =>
      expect(canEnter(module)).toBe(true),
    );
  });

  it('sends an unknown module to the start page', () => {
    asRole('ADMIN');
    expect(canEnter('no-existe')).toBeInstanceOf(UrlTree);
  });
});
