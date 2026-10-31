import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../../services/session/session.service';
import { findModule } from '../../config/navigation/navigation';

export const moduleRoleGuard: CanActivateFn = (route) => {
  const roles = inject(SessionService).profile()?.roles ?? [];
  const module = findModule(route.data['module']);
  return (
    (module?.roles.some((role) => roles.includes(role)) ?? false) ||
    inject(Router).createUrlTree(['/inicio'])
  );
};
