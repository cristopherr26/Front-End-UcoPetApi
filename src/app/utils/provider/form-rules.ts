import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

// Mismas reglas que ProviderDomain.validate() del backend.
// El backend hace trim() ANTES de validar. Angular valida el texto tal cual lo escribe
// el usuario, así que cada regla se envuelve en trimmed() para validar el texto ya recortado.
function trimmed(validator: ValidatorFn): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : control.value;
    return validator({ value } as AbstractControl);
  };
}

const MOBILE_PATTERN = /^\d{7,15}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NO_WHITESPACE_PATTERN = /^\S+$/;

export const PROVIDER_RULES = {
  // obligatorio, máximo 100
  providerName: [trimmed(Validators.required), trimmed(Validators.maxLength(100))],
  // obligatorio, máximo 100
  representName: [trimmed(Validators.required), trimmed(Validators.maxLength(100))],
  // obligatorio
  idType: [Validators.required],
  // obligatorio, sin espacios, máximo 20
  documentNumber: [
    trimmed(Validators.required),
    trimmed(Validators.pattern(NO_WHITESPACE_PATTERN)),
    trimmed(Validators.maxLength(20)),
  ],
  // opcional; si se llena: solo dígitos, entre 7 y 15
  mobileNumber: [trimmed(Validators.pattern(MOBILE_PATTERN))],
  // opcional, máximo 150
  address: [trimmed(Validators.maxLength(150))],
  // opcional; si se llena: máximo 120 y formato de correo (el mismo patrón del backend)
  email: [trimmed(Validators.maxLength(120)), trimmed(Validators.pattern(EMAIL_PATTERN))],
};
