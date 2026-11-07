import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { Person } from '../../../models/person/person.model';
import { PersonService } from '../../../services/person/person.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import { NEW_PASSWORD_RULES, fullName, passwordsMatch } from '../../../utils/person/form-rules';

@Component({
  selector: 'app-password-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './password-form.html',
})
export class PasswordForm {
  private readonly personService = inject(PersonService);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      password: ['', NEW_PASSWORD_RULES],
      confirm: [''],
    },
    { validators: passwordsMatch('password', 'confirm') },
  );
  protected readonly person = signal<Person | null>(null);
  protected readonly name = signal('');
  protected readonly show = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  start(person: Person): void {
    this.person.set(person);
    this.name.set(fullName(person));
  }

  protected save(): void {
    const id = this.person()?.id;
    if (this.form.invalid || !id) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.personService.setPassword(id, { password: this.form.getRawValue().password }).subscribe({
      next: () => this.modal.close(),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'No se pudo asignar la contraseña'));
      },
    });
  }

  protected passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.touched && control.invalid;
  }

  protected confirmInvalid(): boolean {
    return this.form.controls.confirm.touched && this.form.hasError('passwordsMismatch');
  }
}
