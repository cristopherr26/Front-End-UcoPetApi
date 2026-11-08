import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';



// Cuenta el largo sin espacios al inicio y al final
export function trimmedLength(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = String(control.value ?? '').trim().length;
    return length >= min && length <= max ? null : { trimmedLength: { min, max, actual: length } };
  };
}

// 3 letras mayúsculas, un guion y números CON-101
export const CODE_RULES: ValidatorFn[] = [
  Validators.required,
  trimmedLength(1, 10),
  Validators.pattern(/^\s*[A-Z]{3}-\d+\s*$/),
];

export const TYPE_RULES: ValidatorFn[] = [Validators.required, trimmedLength(5, 50)];

export const DESCRIPTION_RULES: ValidatorFn[] = [Validators.required, trimmedLength(10, 255)];


export const SPACE_TYPE_SUGGESTIONS = [
  'Consultorio',
  'Quirófano',
  'Laboratorio',
  'Peluquería',
  'Sala de espera',
  'Hospitalización',
];