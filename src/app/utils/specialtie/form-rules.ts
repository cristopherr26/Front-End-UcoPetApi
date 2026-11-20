import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { Doctor } from '../../models/doctor/doctor.model';
import { PersonSummary } from '../../models/person/person.model';
import { Specialtie } from '../../models/specialtie/specialtie.model';
import {
  VERIFICATION_STATUSES,
  VerificationStatus,
} from '../../models/specialtie/specialtie-doctor.model';
import { personName, shortId } from '../doctor/form-rules';

// Mismas reglas que valida el backend
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 150;
export const REJECTION_MAX = 500;
export const NOTES_MAX = 500;

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$/;
const DESCRIPTION_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ0-9 .,;:()\-/]+$/;
const URL_REGEX = /^https?:\/\/[^\s/?#]+[^\s]*$/i;

// Nombre: obligatorio, solo letras (con tildes y ñ) y espacios
export const specialtieNameRule: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  return NAME_REGEX.test(value) ? null : { nameChars: true };
};

// Descripción: obligatoria, 10 a 150 caracteres, letras, dígitos, espacios y . , ; : ( ) - /
export const specialtieDescriptionRule: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  if (value.length < DESCRIPTION_MIN || value.length > DESCRIPTION_MAX) {
    return { descriptionLength: true };
  }
  return DESCRIPTION_REGEX.test(value) ? null : { descriptionChars: true };
};

// URL del certificado: obligatoria y con http:// o https://
export const certificateUrlRule: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  return URL_REGEX.test(value) ? null : { url: true };
};

// Texto obligatorio que no sea solo espacios (motivo de rechazo)
export const requiredTextRule: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() === '' ? { required: true } : null;

// Nombre legible del médico: nombre de la persona o, si no se conoce, la tarjeta profesional
export function doctorLabel(
  doctorId: string,
  doctors: Doctor[],
  persons: Map<string, PersonSummary>,
): string {
  const doctor = doctors.find((item) => item.id === doctorId);
  if (!doctor) {
    return `Veterinario ${shortId(doctorId)}…`;
  }
  return personName(persons.get(doctor.idPerson)) ?? `Tarjeta ${doctor.licenseNumber}`;
}

export function specialtieLabel(specialtieId: string, specialties: Specialtie[]): string {
  const specialtie = specialties.find((item) => item.id === specialtieId);
  return specialtie?.name || `Especialidad ${shortId(specialtieId)}…`;
}

export function personLabel(
  personId: string | null,
  persons: Map<string, PersonSummary>,
): string | null {
  if (!personId) {
    return null;
  }
  return personName(persons.get(personId)) ?? `Usuario ${shortId(personId)}…`;
}

export function statusLabel(status: VerificationStatus): string {
  return VERIFICATION_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function statusTag(status: VerificationStatus): string {
  return VERIFICATION_STATUSES.find((item) => item.value === status)?.tag ?? 'is-neutral';
}

export function statusIcon(status: VerificationStatus): string {
  return VERIFICATION_STATUSES.find((item) => item.value === status)?.icon ?? 'bi-circle';
}
