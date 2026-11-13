import { FormControl } from '@angular/forms';

import { CODE_RULES, DESCRIPTION_RULES, TYPE_RULES } from './form-rules';

describe('space form rules', () => {
  const code = (value: string) => new FormControl(value, CODE_RULES).valid;
  const type = (value: string) => new FormControl(value, TYPE_RULES).valid;
  const description = (value: string) => new FormControl(value, DESCRIPTION_RULES).valid;

  it('accepts a code of 3 capital letters, a hyphen and digits, like the API', () => {
    expect(code('CON-101')).toBe(true);
    expect(code('LAB-4')).toBe(true);
    expect(code('  CON-101  ')).toBe(true);
    expect(code('con-101')).toBe(false);
    expect(code('CONS-101')).toBe(false);
    expect(code('CON101')).toBe(false);
    expect(code('CON-')).toBe(false);
    expect(code('')).toBe(false);
    expect(code('   ')).toBe(false);
  });

  it('rejects a code longer than 10 characters', () => {
    expect(code('ABC-1234567')).toBe(false);
    expect(code('ABC-123456')).toBe(true);
  });

  it('asks for a type between 5 and 50 characters, counted without outer spaces', () => {
    expect(type('Sala')).toBe(false);
    expect(type('Salas')).toBe(true);
    expect(type('  Sala  ')).toBe(false);
    expect(type('a'.repeat(50))).toBe(true);
    expect(type('a'.repeat(51))).toBe(false);
    expect(type('')).toBe(false);
  });

  it('asks for a description between 10 and 255 characters, counted without outer spaces', () => {
    expect(description('Corta')).toBe(false);
    expect(description('Descripción válida')).toBe(true);
    expect(description('   corta   ')).toBe(false);
    expect(description('a'.repeat(255))).toBe(true);
    expect(description('a'.repeat(256))).toBe(false);
  });
});