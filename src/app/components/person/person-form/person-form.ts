import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { PersonFields } from '../person-fields/person-fields';
import { Person } from '../../../models/person/person.model';
import { PersonService } from '../../../services/person/person.service';
import { SessionService } from '../../../services/session/session.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { patchPersonFields, personFieldsGroup, toPerson } from '../../../utils/person/form-rules';

@Component({
  selector: 'app-person-form',
  imports: [ReactiveFormsModule, ModalFrame, PersonFields],
  templateUrl: './person-form.html',
})
export class PersonForm {
  private readonly personService = inject(PersonService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly documentTypes = toSignal(this.personService.documentTypes(), {
    initialValue: [],
  });
  protected readonly fields = personFieldsGroup(this.fb);
  protected readonly access = this.fb.group({ admin: [false], active: [true] });
  protected readonly form = this.fb.group({ fields: this.fields, access: this.access });

  protected readonly personId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isMe = computed(
    () => this.personId() !== null && this.personId() === this.session.profile()?.personId,
  );

  edit(person: Person): void {
    this.personId.set(person.id ?? null);
    patchPersonFields(this.fields, person);
    this.access.setValue({ admin: person.admin, active: person.active });
    if (this.isMe()) {
      this.access.disable();
    }
  }

  protected save(): void {
    if (this.fields.invalid) {
      this.fields.markAllAsTouched();
      return;
    }
    const { admin, active } = this.access.getRawValue();
    const person = toPerson(this.fields, admin, active);
    const id = this.personId();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.personService.update(id, person) : this.personService.create(person)).subscribe({
      next: (saved) => this.modal.close(saved),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo guardar la persona'));
      },
    });
  }
}
