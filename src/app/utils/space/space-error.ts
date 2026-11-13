import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from '../shared/api-error';

// Los 400 de validación de Space traen el motivo en "detail" (ProblemDetail),
// no en "message" 
export function spaceErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const detail = error.error?.detail;
  return error.status === 400 && typeof detail === 'string' && detail !== ''
    ? detail
    : apiErrorMessage(error, fallback);
}