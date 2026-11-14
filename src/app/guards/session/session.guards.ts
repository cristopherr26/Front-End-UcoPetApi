import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../../services/session/session.service';

export const sessionGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).isLoggedIn() ||
  inject(Router).createUrlTree(['/login'], { queryParams: state.url === '/' ? {} : { volver: state.url } });

export const guestGuard: CanActivateFn = () =>
  !inject(SessionService).isLoggedIn() || inject(Router).createUrlTree(['/inicio']);
