import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { PersonSummary } from '../../models/person/person.model';

export const LICENSE_MIN = 4;
export const LICENSE_MAX = 30;
const LICENSE_REGEX = /^[A-Za-z0-9-]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const licenseNumberRule: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  if (value.length < LICENSE_MIN || value.length > LICENSE_MAX) {
    return { licenseLength: true };
  }
  return LICENSE_REGEX.test(value) ? null : { licenseChars: true };
};

export const UUID_RULES: ValidatorFn[] = [Validators.required, Validators.pattern(UUID_REGEX)];

export function isUuid(value: string | null | undefined): boolean {
  return UUID_REGEX.test((value ?? '').trim());
}

export function personName(person: PersonSummary | undefined): string | null {
  if (!person) {
    return null;
  }
  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return name === '' ? null : name;
}

export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : '—';
}