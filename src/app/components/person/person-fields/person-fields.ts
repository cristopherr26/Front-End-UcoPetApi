import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { DocumentTypeOption } from '../../../models/person/person.model';
import { PersonFieldsGroup } from '../../../utils/person/form-rules';

@Component({
  selector: 'app-person-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './person-fields.html',
})
export class PersonFields {
  readonly form = input.required<PersonFieldsGroup>();
  readonly documentTypes = input<DocumentTypeOption[]>([]);
  readonly idPrefix = input('person');

  protected invalid(field: keyof PersonFieldsGroup['controls']): boolean {
    const control = this.form().controls[field];
    return control.touched && control.invalid;
  }
}
