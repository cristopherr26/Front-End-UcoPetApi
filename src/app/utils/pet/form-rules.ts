import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';


const ZONE_ID = 'America/Bogota';

const TEXT_REGEX =/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;


// Validaciones para el nombre
export const NAME_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(100),
  Validators.pattern(TEXT_REGEX),
];


//Validaciones para la raza
export const BREED_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(50),
  Validators.pattern(TEXT_REGEX),
];


//Validaciones para la especie
export const SPECIES_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(3),
  Validators.maxLength(50),
  Validators.pattern(TEXT_REGEX),
];

// Validaciones para el género
// Únicamente acepta M o F
export const GENDER_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.pattern(/^[MF]$/),
];

// Valida que la fecha tenga formato yyyy-MM-dd
export const DATE_FORMAT_RULE: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {

  const value = control.value;

  if (!value) {
    return null;
  }

  return DATE_REGEX.test(value)
    ? null
    : { invalidDateFormat: true };
};


//Valida que la fecha exista en el calendario
export const VALID_CALENDAR_DATE_RULE: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {

  const value = control.value;

  if (!value || !DATE_REGEX.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().substring(0, 10) !== value
  ) {
    return { invalidCalendarDate: true };
  }

  return null;
};


// Obtiene la fecha actual de Colombia
// Retorna yyyy-MM-dd
function getBogotaToday(): string {

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE_ID,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}


// Impide que la fecha de nacimiento sea futura
export const NOT_FUTURE_DATE_RULE: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {

  const value = control.value;

  if (!value || !DATE_REGEX.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().substring(0, 10) !== value
  ) {
    return null;
  }

  return value <= getBogotaToday()
    ? null
    : { futureDate: true };
};

// Reglas para la fecha de nacimiento.
export const BIRTH_DATE_RULES: ValidatorFn[] = [
  Validators.required,
  DATE_FORMAT_RULE,
  VALID_CALENDAR_DATE_RULE,
  NOT_FUTURE_DATE_RULE,
];


// Valida que la URL sea HTTP o HTTPS

export const PHOTO_URL_RULE: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {

  const value = control.value;

  if (!value) {
    return null;
  }

  try {

    const url = new URL(value);

    const validProtocol =
      url.protocol === 'http:' ||
      url.protocol === 'https:';

    return validProtocol && !!url.hostname
      ? null
      : { invalidUrl: true };

  } catch {
    return { invalidUrl: true };
  }
};


// Reglas para la fotografía

export const PHOTO_URL_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(500),
  PHOTO_URL_RULE,
];


// Elimina espacios al inicio y al final
export function trimValue(value: string): string {
  return value.trim();
}