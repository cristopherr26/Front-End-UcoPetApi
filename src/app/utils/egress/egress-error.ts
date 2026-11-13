import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from '../shared/api-error';

export function egressErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 503) {
    return 'RabbitMQ no está disponible: el egreso no se envió a procesar. Intenta de nuevo.';
  }
  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim() !== '') {
      return message.trim();
    }
  }
  return apiErrorMessage(error, fallback);
}
