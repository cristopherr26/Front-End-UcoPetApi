import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { PageHeader } from '../../shared/page-header';
import { PersonFields } from '../person-fields/person-fields';
import { Person } from '../../../models/person/person.model';
import { PersonService } from '../../../services/person/person.service';
import { SessionService } from '../../../services/session/session.service';
import { ToastService } from '../../../services/shared/toast.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';
import {
  NEW_PASSWORD_RULES,
  fullName,
  passwordsMatch,
  patchPersonFields,
  personFieldsGroup,
  toPerson,
} from '../../../utils/person/form-rules';

@Component({
  selector: 'app-my-account',
  imports: [ReactiveFormsModule, PageHeader, PersonFields],
  templateUrl: './my-account.html',
})
export class MyAccount {
  private readonly personService = inject(PersonService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly documentTypes = toSignal(this.personService.documentTypes(), {
    initialValue: [],
  });

  protected readonly fields = personFieldsGroup(this.fb);
  protected readonly dataForm = this.fb.group({ fields: this.fields });
  protected readonly me = signal<Person | null>(null);
  protected readonly loading = signal(true);
  protected readonly savingData = signal(false);
  protected readonly dataError = signal<string | null>(null);

  protected readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required, Validators.maxLength(72)]],
      newPassword: ['', NEW_PASSWORD_RULES],
      confirmPassword: [''],
    },
    { validators: passwordsMatch('newPassword', 'confirmPassword') },
  );
  protected readonly showPasswords = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal<string | null>(null);

  constructor() {
    this.personService.me().subscribe({
      next: (person) => {
        this.me.set(person);
        patchPersonFields(this.fields, person);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.dataError.set(apiErrorMessage(error, 'No se pudieron cargar tus datos'));
      },
    });
  }

  protected saveData(): void {
    const me = this.me();
    if (this.fields.invalid || !me?.id) {
      this.fields.markAllAsTouched();
      return;
    }
    const person = toPerson(this.fields, me.admin, me.active);
    this.savingData.set(true);
    this.dataError.set(null);
    this.personService.update(me.id, person).subscribe({
      next: (saved) => {
        this.savingData.set(false);
        this.me.set(saved);
        this.session.updateFullName(fullName(saved));
        this.fields.markAsPristine();
        this.toast.success('Tus datos se enviaron; se aplican en un momento');
      },
      error: (error: HttpErrorResponse) => {
        this.savingData.set(false);
        this.dataError.set(apiErrorMessage(error, 'No se pudieron guardar tus datos'));
      },
    });
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.personService.changeOwnPassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.session.clear();
        this.toast.success('Contraseña cambiada. Inicia sesión con la nueva');
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.passwordError.set(
          error.status === 401
            ? 'La contraseña actual no es correcta'
            : apiErrorMessage(error, 'No se pudo cambiar la contraseña'),
        );
      },
    });
  }

  protected passwordInvalid(field: 'currentPassword' | 'newPassword'): boolean {
    const control = this.passwordForm.controls[field];
    return control.touched && control.invalid;
  }

  protected confirmInvalid(): boolean {
    return (
      this.passwordForm.controls.confirmPassword.touched &&
      this.passwordForm.hasError('passwordsMismatch')
    );
  }
}
