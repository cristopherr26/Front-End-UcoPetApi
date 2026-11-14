import { HttpErrorResponse } from '@angular/common/http';

import { appointmentErrorMessage } from './appointment-errors';

const fail = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('appointmentErrorMessage', () => {
  it('shows the reason the API gives (schedule taken, date in the past...)', () => {
    const error = fail(409, {
      message: 'El medico ya tiene una cita programada para esa fecha y hora',
    });
    expect(appointmentErrorMessage(error, 'x')).toBe(
      'El medico ya tiene una cita programada para esa fecha y hora',
    );
  });

  it('explains a missing connection and a missing permission', () => {
    expect(appointmentErrorMessage(fail(0), 'x')).toBe('No hay conexión con la API');
    expect(appointmentErrorMessage(fail(403), 'x')).toBe(
      'Tu rol no tiene permiso para esta acción',
    );
  });

  it('falls back when the body has no usable message', () => {
    expect(appointmentErrorMessage(fail(400, { message: '' }), 'No se pudo enviar')).toBe(
      'No se pudo enviar',
    );
    expect(appointmentErrorMessage(fail(404), 'No se pudo enviar')).toBe('No se pudo enviar');
  });

  it('points to the API and RabbitMQ on a server error without message', () => {
    expect(appointmentErrorMessage(fail(500), 'No se pudo enviar')).toContain('RabbitMQ');
  });
});
