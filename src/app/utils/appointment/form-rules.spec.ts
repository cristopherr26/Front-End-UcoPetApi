import { FormControl, FormGroup } from '@angular/forms';

import {
  REASON_RULES,
  TYPE_DESCRIPTION_RULES,
  TYPE_NAME_RULES,
  notPastDate,
  notPastTime,
  trimOrNull,
} from './form-rules';

describe('appointment form rules', () => {
  it('requires a cancellation reason that is not blank, like the API', () => {
    const valid = (value: string) => new FormControl(value, REASON_RULES).valid;
    expect(valid('El tutor no puede asistir')).toBe(true);
    expect(valid('')).toBe(false);
    expect(valid('   ')).toBe(false);
    expect(valid('a'.repeat(256))).toBe(false);
  });

  it('requires a type name up to 100 characters', () => {
    const valid = (value: string) => new FormControl(value, TYPE_NAME_RULES).valid;
    expect(valid('Consulta general')).toBe(true);
    expect(valid('  ')).toBe(false);
    expect(valid('a'.repeat(101))).toBe(false);
  });

  it('requires a type description up to 255 characters', () => {
    const valid = (value: string) => new FormControl(value, TYPE_DESCRIPTION_RULES).valid;
    expect(valid('Revisión general del paciente')).toBe(true);
    expect(valid('')).toBe(false);
    expect(valid('   ')).toBe(false);
    expect(valid('a'.repeat(256))).toBe(false);
  });

  describe('notPastTime', () => {
    const now = () => new Date(2026, 10, 4, 20, 45);
    const check = (date: string, time: string, saved: { date: string; time: string } | null) =>
      new FormGroup(
        { appointmentDate: new FormControl(date), appointmentTime: new FormControl(time) },
        { validators: notPastTime(() => saved, now) },
      ).errors;

    it('rejects a time that already passed today', () => {
      expect(check('2026-11-04', '19:25', null)).toEqual({ pastTime: true });
    });

    it('accepts a later time today and any time on another day', () => {
      expect(check('2026-11-04', '21:00', null)).toBeNull();
      expect(check('2026-11-05', '08:00', null)).toBeNull();
    });

    it('lets an existing appointment keep its schedule, but not move it to a past time', () => {
      const saved = { date: '2026-11-04', time: '19:25' };
      expect(check('2026-11-04', '19:25', saved)).toBeNull();
      expect(check('2026-11-04', '19:30', saved)).toEqual({ pastTime: true });
    });
  });

  it('rejects a date in the past but accepts today and later', () => {
    const check = (value: string) =>
      new FormControl(
        value,
        notPastDate(() => '2026-11-04'),
      ).errors;
    expect(check('2026-11-03')).toEqual({ pastDate: true });
    expect(check('2026-11-04')).toBeNull();
    expect(check('2026-12-01')).toBeNull();
    expect(check('')).toBeNull();
  });

  it('turns blank text into null', () => {
    expect(trimOrNull('  hola ')).toBe('hola');
    expect(trimOrNull('   ')).toBeNull();
    expect(trimOrNull(null)).toBeNull();
  });
});
