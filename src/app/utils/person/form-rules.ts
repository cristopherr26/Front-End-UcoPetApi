import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { DocumentType, Person } from '../../models/person/person.model';

const NOT_BLANK = Validators.pattern(/\S/);

export const DOCUMENT_NUMBER_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.pattern(/^[A-Za-z0-9-]{4,20}$/),
];

export const NAME_RULES: ValidatorFn[] = [Validators.required, NOT_BLANK, Validators.maxLength(60)];

export const EMAIL_RULES: ValidatorFn[] = [Validators.email, Validators.maxLength(120)];

export const PHONE_RULES: ValidatorFn[] = [Validators.pattern(/^\+?[0-9 -]{7,20}$/)];

export const ADDRESS_RULES: ValidatorFn[] = [Validators.maxLength(200)];

export const NEW_PASSWORD_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(72),
];

export function passwordsMatch(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(field)?.value;
    const confirm = group.get(confirmField)?.value;
    return !confirm || password === confirm ? null : { passwordsMismatch: true };
  };
}

export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

export function fullName(person: Pick<Person, 'firstName' | 'lastName'>): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function personFieldsGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    documentType: fb.control<DocumentType | null>(null, Validators.required),
    documentNumber: ['', DOCUMENT_NUMBER_RULES],
    firstName: ['', NAME_RULES],
    lastName: ['', NAME_RULES],
    email: ['', EMAIL_RULES],
    phone: ['', PHONE_RULES],
    address: ['', ADDRESS_RULES],
  });
}

export type PersonFieldsGroup = ReturnType<typeof personFieldsGroup>;

export function patchPersonFields(group: PersonFieldsGroup, person: Person): void {
  group.patchValue({
    documentType: person.documentType,
    documentNumber: person.documentNumber,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email ?? '',
    phone: person.phone ?? '',
    address: person.address ?? '',
  });
}

export function toPerson(group: PersonFieldsGroup, admin: boolean, active: boolean): Person {
  const value = group.getRawValue();
  return {
    documentType: value.documentType as DocumentType,
    documentNumber: value.documentNumber.trim(),
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    email: blankToNull(value.email)?.toLowerCase() ?? null,
    phone: blankToNull(value.phone),
    address: blankToNull(value.address),
    admin,
    active,
  };
}
