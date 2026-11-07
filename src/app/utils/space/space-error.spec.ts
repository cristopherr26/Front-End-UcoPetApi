import { HttpErrorResponse } from '@angular/common/http';

import { spaceErrorMessage } from './space-error';

describe('spaceErrorMessage', () => {
  const failure = (status: number, error: unknown = null) =>
    new HttpErrorResponse({ status, error });

  it('uses the "detail" the API sends on a validation error', () => {
    const error = failure(400, { detail: 'La sede indicada no existe.' });
    expect(spaceErrorMessage(error, 'fallback')).toBe('La sede indicada no existe.');
  });

  it('falls back to the shared messages for everything else', () => {
    expect(spaceErrorMessage(failure(0), 'fallback')).toBe('No hay conexión con la API');
    expect(spaceErrorMessage(failure(403), 'fallback')).toBe(
      'Tu rol no tiene permiso para esta acción',
    );
    expect(spaceErrorMessage(failure(404), 'No se encontró')).toBe('No se encontró');
    expect(spaceErrorMessage(failure(400, {}), 'fallback')).toBe('fallback');
  });
});