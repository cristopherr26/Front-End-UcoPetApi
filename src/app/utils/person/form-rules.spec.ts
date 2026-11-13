import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import {
  DOCUMENT_NUMBER_RULES,
  NAME_RULES,
  NEW_PASSWORD_RULES,
  PHONE_RULES,
  fullName,
  passwordsMatch,
  personFieldsGroup,
  toPerson,
} from './form-rules';

describe('person form rules', () => {
  const valid = (rules: Parameters<typeof FormControl.prototype.setValidators>[0], value: string) =>
    new FormControl(value, rules).valid;

  it('accepts 4 to 20 letters, digits and hyphens in the document, like the API', () => {
    expect(valid(DOCUMENT_NUMBER_RULES, '1036222333')).toBe(true);
    expect(valid(DOCUMENT_NUMBER_RULES, 'E-55821')).toBe(true);
    expect(valid(DOCUMENT_NUMBER_RULES, '123')).toBe(false);
    expect(valid(DOCUMENT_NUMBER_RULES, '1'.repeat(21))).toBe(false);
    expect(valid(DOCUMENT_NUMBER_RULES, '1036 222')).toBe(false);
    expect(valid(DOCUMENT_NUMBER_RULES, '')).toBe(false);
  });

  it('requires names that are not blank and up to 60 characters', () => {
    expect(valid(NAME_RULES, 'José')).toBe(true);
    expect(valid(NAME_RULES, '   ')).toBe(false);
    expect(valid(NAME_RULES, 'a'.repeat(61))).toBe(false);
  });

  it('accepts an empty phone or 7 to 20 digits, spaces, hyphens and a leading +', () => {
    expect(valid(PHONE_RULES, '')).toBe(true);
    expect(valid(PHONE_RULES, '+57 300 111 2233')).toBe(true);
    expect(valid(PHONE_RULES, '604-555-1234')).toBe(true);
    expect(valid(PHONE_RULES, '12345')).toBe(false);
    expect(valid(PHONE_RULES, '300 abc 1234')).toBe(false);
  });

  it('requires a new password of 8 to 72 characters', () => {
    expect(valid(NEW_PASSWORD_RULES, 'corta')).toBe(false);
    expect(valid(NEW_PASSWORD_RULES, 'suficiente')).toBe(true);
    expect(valid(NEW_PASSWORD_RULES, 'a'.repeat(73))).toBe(false);
  });

  it('marks the group when the confirmation does not match', () => {
    const group = new FormGroup(
      { password: new FormControl('claveNueva1'), confirm: new FormControl('otra') },
      { validators: passwordsMatch('password', 'confirm') },
    );
    expect(group.hasError('passwordsMismatch')).toBe(true);
    group.controls.confirm.setValue('claveNueva1');
    expect(group.hasError('passwordsMismatch')).toBe(false);
  });

  it('builds the API body with trimmed texts and empty fields as null', () => {
    const fields = personFieldsGroup(TestBed.inject(NonNullableFormBuilder));
    fields.setValue({
      documentType: 'CC',
      documentNumber: ' 1036222333 ',
      firstName: ' José ',
      lastName: 'Restrepo',
      email: ' Jose@UcoPet.com ',
      phone: '   ',
      address: '',
    });
    expect(toPerson(fields, false, true)).toEqual({
      documentType: 'CC',
      documentNumber: '1036222333',
      firstName: 'José',
      lastName: 'Restrepo',
      email: 'jose@ucopet.com',
      phone: null,
      address: null,
      admin: false,
      active: true,
    });
  });

  it('joins first and last name', () => {
    expect(fullName({ firstName: 'José', lastName: 'Restrepo' })).toBe('José Restrepo');
  });
});
