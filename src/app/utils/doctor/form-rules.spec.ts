import { FormControl } from '@angular/forms';

import { UUID_RULES, isUuid, licenseNumberRule, personName } from './form-rules';

describe('doctor form rules', () => {
  const license = (value: string) => new FormControl(value, licenseNumberRule).errors;

  it('requires a license number', () => {
    expect(license('')).toEqual({ required: true });
    expect(license('    ')).toEqual({ required: true });
  });

  it('accepts 4 to 30 characters on the trimmed value, like the API', () => {
    expect(license('LIC-001')).toBeNull();
    expect(license('  ABCD  ')).toBeNull();
    expect(license('abc')).toEqual({ licenseLength: true });
    expect(license('a'.repeat(31))).toEqual({ licenseLength: true });
    expect(license('a'.repeat(30))).toBeNull();
  });

  it('accepts only letters, digits and hyphens', () => {
    expect(license('LIC 001')).toEqual({ licenseChars: true });
    expect(license('LIC_001')).toEqual({ licenseChars: true });
    expect(license('LIC#001')).toEqual({ licenseChars: true });
  });

  it('validates the person id as a UUID', () => {
    const id = (value: string) => new FormControl(value, UUID_RULES).valid;
    expect(id('3f2b8c1e-9a4d-4e6b-8f21-0c7d5a9e1b34')).toBe(true);
    expect(id('')).toBe(false);
    expect(id('11111111-1111')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
  });

  it('builds a person name or null when unknown', () => {
    expect(personName({ id: '1', firstName: 'Ana', lastName: 'Ruiz' })).toBe('Ana Ruiz');
    expect(personName(undefined)).toBeNull();
  });
});