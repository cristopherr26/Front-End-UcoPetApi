import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { isPastTime, todayIso } from './appointment-schedule';

// Como la API: la justificación de una cancelación es obligatoria.
export const REASON_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(255),
  Validators.pattern(/\S/),
];

export const TYPE_NAME_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(100),
  Validators.pattern(/\S/),
];

// Como la API: la descripción del tipo de cita es obligatoria.
export const TYPE_DESCRIPTION_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(255),
  Validators.pattern(/\S/),
];

// La fecha de la cita no puede estar en el pasado (la API devuelve 400 si lo está).
export function notPastDate(today: () => string = todayIso): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    return value && value < today() ? { pastDate: true } : null;
  };
}

// Horario de una cita ya guardada. Al editar sin cambiar la fecha ni la hora no se vuelve a exigir
// que sea futura (la API tampoco lo hace): así se puede corregir otro dato de una cita de hoy.
export interface SavedSchedule {
  date: string;
  time: string;
}

// Validador del formulario completo: hoy con una hora que ya pasó (la API devuelve 400).
export function notPastTime(
  saved: () => SavedSchedule | null = () => null,
  now: () => Date = () => new Date(),
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const date = group.get('appointmentDate')?.value as string | null;
    const time = group.get('appointmentTime')?.value as string | null;
    const original = saved();
    const unchanged = !!original && original.date === date && original.time === time?.slice(0, 5);
    return !unchanged && isPastTime(date, time, now()) ? { pastTime: true } : null;
  };
}

export function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}
