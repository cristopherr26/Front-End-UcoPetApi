import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session/session.service';

const KEEP_SESSION_ON_401 = ['/persons/login', '/persons/me/password'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const toApi = request.url.startsWith(environment.apiBase);
  const sent = toApi ? request.clone({ withCredentials: true }) : request;

  return next(sent).pipe(
    catchError((error: HttpErrorResponse) => {
      const keepSession = KEEP_SESSION_ON_401.some((path) => request.url.endsWith(path));
      if (toApi && error.status === 401 && !keepSession) {
        session.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
