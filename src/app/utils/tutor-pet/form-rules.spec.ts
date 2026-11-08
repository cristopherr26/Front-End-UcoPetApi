import { FormControl, NonNullableFormBuilder, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { toTutorPetRequest, tutorPetFormGroup } from './form-rules';

describe('tutor-pet form rules', () => {
  it('requires the associated person, as the API DTO does', () => {
    expect(new FormControl('', Validators.required).valid).toBe(false);
    expect(new FormControl('person-1', Validators.required).valid).toBe(true);
  });

  it('builds the API body with the selected person ID trimmed', () => {
    const form = tutorPetFormGroup(TestBed.inject(NonNullableFormBuilder));
    form.controls.person.setValue(' person-1 ');

    expect(toTutorPetRequest(form)).toEqual({ person: 'person-1' });
  });
});