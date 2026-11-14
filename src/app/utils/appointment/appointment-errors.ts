import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from '../shared/api-error';

// Mensaje para el usuario cuando falla una llamada del módulo de citas.
// Si la API explica el rechazo (fecha pasada, horario ocupado...), se muestra tal cual.
export function appointmentErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0 || error.status === 403) {
    return apiErrorMessage(error, fallback);
  }
  const message = error.error?.message;
  if (typeof message === 'string' && message.trim() !== '') {
    return message;
  }
  if (error.status >= 500) {
    return `${fallback}. Revisa que la API y RabbitMQ estén encendidos`;
  }
  return fallback;
}
