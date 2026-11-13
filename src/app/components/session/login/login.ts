import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { Brand } from '../../shared/brand';
import { SessionService } from '../../../services/session/session.service';
import { apiErrorMessage } from '../../../utils/shared/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Brand],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.session.login(email.trim(), password).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        this.form.controls.password.reset();
        this.error.set(loginErrorMessage(error));
      },
    });
  }

  protected invalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}

function loginErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Correo o contraseña incorrectos';
  }
  if (error.status === 423) {
    return error.error?.message ?? 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  }
  return apiErrorMessage(error, 'No se pudo iniciar sesión');
}
