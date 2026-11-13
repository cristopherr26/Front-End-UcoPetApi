import { HttpErrorResponse } from '@angular/common/http';

// Saca el texto que mandó el backend. Acepta { message } (manejadores propios)
// y { detail } (ProblemDetail). El cuerpo por defecto de Spring para un 500 no trae
// ninguno de los dos, y en ese caso se devuelve null.
function backendMessage(error: HttpErrorResponse): string | null {
  const body: unknown = error.error;
  if (typeof body === 'object' && body !== null) {
    const { message, detail } = body as { message?: unknown; detail?: unknown };
    for (const candidate of [message, detail]) {
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim();
      }
    }
  }
  return null;
}

export function providerErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'No hay conexión con la API';
  }
  const message = backendMessage(error);
  switch (error.status) {
    case 400:
      return message ?? 'Los datos enviados no son válidos';
    case 401:
      return 'Tu sesión expiró. Inicia sesión de nuevo';
    case 403:
      return 'Tu rol no tiene permiso para gestionar proveedores (solo ADMIN)';
    case 404:
      return message ?? 'El proveedor no existe';
    case 409:
      return message ?? 'El proveedor entra en conflicto con otro ya registrado';
    default:
      return message ?? fallback;
  }
}
