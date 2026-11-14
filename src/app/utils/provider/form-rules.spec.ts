import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';

import { ProviderStatusPipe } from '../../pipes/provider/provider-status.pipe';
import { PROVIDER_RULES } from './form-rules';
import { providerErrorMessage } from './provider-error';
import { toProviderPayload } from './provider-payload';

const valid = (value: string, rules: (typeof PROVIDER_RULES)[keyof typeof PROVIDER_RULES]) =>
  new FormControl(value, rules).valid;

describe('provider form rules (same as ProviderDomain.validate)', () => {
  it('requires the provider and representative names, up to 100 characters', () => {
    for (const rules of [PROVIDER_RULES.providerName, PROVIDER_RULES.representName]) {
      expect(valid('Distribuidora Pet', rules)).toBe(true);
      expect(valid('', rules)).toBe(false);
      expect(valid('    ', rules)).toBe(false);
      expect(valid('a'.repeat(100), rules)).toBe(true);
      expect(valid('a'.repeat(101), rules)).toBe(false);
    }
  });

  it('measures the length after trimming, like the backend', () => {
    expect(valid(`  ${'a'.repeat(100)}  `, PROVIDER_RULES.providerName)).toBe(true);
  });

  it('requires a document number without spaces, up to 20 characters', () => {
    expect(valid('900123456', PROVIDER_RULES.documentNumber)).toBe(true);
    expect(valid('', PROVIDER_RULES.documentNumber)).toBe(false);
    expect(valid('900 123', PROVIDER_RULES.documentNumber)).toBe(false);
    expect(valid('1'.repeat(20), PROVIDER_RULES.documentNumber)).toBe(true);
    expect(valid('1'.repeat(21), PROVIDER_RULES.documentNumber)).toBe(false);
  });

  it('requires the document type', () => {
    expect(valid('NIT', PROVIDER_RULES.idType)).toBe(true);
    expect(valid('', PROVIDER_RULES.idType)).toBe(false);
  });

  it('accepts an empty mobile number, and otherwise only 7 to 15 digits', () => {
    expect(valid('', PROVIDER_RULES.mobileNumber)).toBe(true);
    expect(valid('   ', PROVIDER_RULES.mobileNumber)).toBe(true);
    expect(valid('3001234567', PROVIDER_RULES.mobileNumber)).toBe(true);
    expect(valid('123456', PROVIDER_RULES.mobileNumber)).toBe(false);
    expect(valid('1'.repeat(16), PROVIDER_RULES.mobileNumber)).toBe(false);
    expect(valid('300-123-4567', PROVIDER_RULES.mobileNumber)).toBe(false);
  });

  it('accepts an empty address, and otherwise up to 150 characters', () => {
    expect(valid('', PROVIDER_RULES.address)).toBe(true);
    expect(valid('a'.repeat(150), PROVIDER_RULES.address)).toBe(true);
    expect(valid('a'.repeat(151), PROVIDER_RULES.address)).toBe(false);
  });

  it('accepts an empty email, and otherwise the backend format up to 120 characters', () => {
    expect(valid('', PROVIDER_RULES.email)).toBe(true);
    expect(valid('ventas@proveedor.com', PROVIDER_RULES.email)).toBe(true);
    expect(valid('a@b', PROVIDER_RULES.email)).toBe(false);
    expect(valid('sin-arroba.com', PROVIDER_RULES.email)).toBe(false);
    expect(valid(`${'a'.repeat(110)}@proveedor.com`, PROVIDER_RULES.email)).toBe(false);
  });
});

describe('provider payload', () => {
  it('trims the texts and sends empty optional fields as null', () => {
    const payload = toProviderPayload({
      providerName: '  Distribuidora Pet ',
      representName: ' Ana Gómez  ',
      idType: 'NIT',
      documentNumber: ' 900123456 ',
      mobileNumber: '   ',
      address: ' Calle 1 ',
      email: '',
    });
    expect(payload).toEqual({
      providerName: 'Distribuidora Pet',
      representName: 'Ana Gómez',
      idType: 'NIT',
      documentNumber: '900123456',
      mobileNumber: null,
      address: 'Calle 1',
      email: null,
    });
  });
});

describe('provider error messages', () => {
  const failure = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

  it('shows the message the backend sends', () => {
    expect(providerErrorMessage(failure(409, { message: 'Ya existe' }), 'x')).toBe('Ya existe');
    expect(providerErrorMessage(failure(400, { message: 'Correo inválido' }), 'x')).toBe(
      'Correo inválido',
    );
    expect(providerErrorMessage(failure(404, { detail: 'No existe' }), 'x')).toBe('No existe');
  });

  it('has its own text for 401, 403 and a lost connection', () => {
    expect(providerErrorMessage(failure(401, null), 'x')).toContain('sesión');
    expect(providerErrorMessage(failure(403, null), 'x')).toContain('ADMIN');
    expect(providerErrorMessage(failure(0, null), 'x')).toContain('conexión');
  });

  it('uses the fallback when a 500 carries no message (Spring default body)', () => {
    const body = { timestamp: 't', status: 500, error: 'Internal Server Error', path: '/p' };
    expect(providerErrorMessage(failure(500, body), 'No se pudo guardar')).toBe(
      'No se pudo guardar',
    );
  });
});

describe('ProviderStatusPipe', () => {
  it('turns the active flag into text', () => {
    const pipe = new ProviderStatusPipe();
    expect(pipe.transform(true)).toBe('Activo');
    expect(pipe.transform(false)).toBe('Inactivo');
  });
});
