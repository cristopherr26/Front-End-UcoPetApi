import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../../services/session/session.service';

export const sessionGuard: CanActivateFn = () =>
  inject(SessionService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

export const guestGuard: CanActivateFn = () =>
  !inject(SessionService).isLoggedIn() || inject(Router).createUrlTree(['/inicio']);
