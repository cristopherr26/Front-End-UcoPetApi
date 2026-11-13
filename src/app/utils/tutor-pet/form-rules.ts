import { NonNullableFormBuilder, Validators } from '@angular/forms';

import { TutorPetRequest } from '../../models/tutor-pet/tutor-pet.model';

/** El backend requiere una persona asociada y no define más reglas para el DTO */
export function tutorPetFormGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    person: ['', Validators.required],
  });
}

export type TutorPetFormGroup = ReturnType<typeof tutorPetFormGroup>;

/** Construye el cuerpo esperado por la API, sin espacios accidentales en el ID */
export function toTutorPetRequest(group: TutorPetFormGroup): TutorPetRequest {
  return { person: group.controls.person.value.trim() };
}