import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'No hay conexión con la API';
  }
  if (error.status === 403) {
    return 'Tu rol no tiene permiso para esta acción';
  }
  if (error.status === 503) {
    return 'El procesador de inventario no respondió a tiempo; no se guardó nada';
  }
  return error.error?.message ?? fallback;
}
