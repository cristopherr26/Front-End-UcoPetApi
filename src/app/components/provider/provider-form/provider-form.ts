import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PageHeader } from '../../shared/page-header';
import { PROVIDER_ALLOWED_DOCUMENT_TYPES } from '../../../models/provider/provider-enums';
import { DocumentTypeOption } from '../../../models/provider/provider.model';
import { ProviderService } from '../../../services/provider/provider.service';
import { ToastService } from '../../../services/shared/toast.service';
import { PROVIDER_RULES } from '../../../utils/provider/form-rules';
import { providerErrorMessage } from '../../../utils/provider/provider-error';
import { toProviderPayload } from '../../../utils/provider/provider-payload';

// Una sola pantalla sirve para crear (/proveedores/new) y para editar (/proveedores/edit/:id),
// igual que el formulario de pólizas.
@Component({
  selector: 'app-provider-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './provider-form.html',
})
export class ProviderForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly providerService = inject(ProviderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = this.fb.group({
    providerName: ['', PROVIDER_RULES.providerName],
    representName: ['', PROVIDER_RULES.representName],
    idType: ['', PROVIDER_RULES.idType],
    documentNumber: ['', PROVIDER_RULES.documentNumber],
    mobileNumber: ['', PROVIDER_RULES.mobileNumber],
    address: ['', PROVIDER_RULES.address],
    email: ['', PROVIDER_RULES.email],
  });

  protected readonly providerId = this.route.snapshot.paramMap.get('id');
  protected readonly isEdit = this.providerId !== null;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly inactive = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly allDocumentTypes = signal<DocumentTypeOption[]>([]);
  private readonly currentIdType = signal<string | null>(null);

  // Solo se ofrecen los tipos permitidos; si el proveedor que se edita tiene otro tipo
  // (por ejemplo uno antiguo), también se incluye para que el campo no quede vacío.
  protected readonly documentTypes = computed(() =>
    this.allDocumentTypes().filter(
      (type) =>
        PROVIDER_ALLOWED_DOCUMENT_TYPES.includes(type.value) || type.value === this.currentIdType(),
    ),
  );

  constructor() {
    // Si el backend dijo "documento repetido", ese aviso se quita al cambiar el tipo
    // (al escribir el número, Angular vuelve a validar solo).
    this.form.controls.idType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.documentNumber.updateValueAndValidity());

    this.loadDocumentTypes();
    if (this.providerId) {
      this.loadProvider(this.providerId);
    }
  }

  protected save(): void {
    if (this.inactive()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = toProviderPayload(this.form.getRawValue());
    this.saving.set(true);
    this.error.set(null);

    const request = this.providerId
      ? this.providerService.updateProvider(this.providerId, payload)
      : this.providerService.createProvider(payload);

    request.subscribe({
      next: (saved) => {
        this.toast.success(
          this.isEdit
            ? `"${saved.providerName}" se envió a actualizar; el procesador lo aplica en un momento`
            : `"${saved.providerName}" se envió a guardar; el procesador lo aplica en un momento`,
        );
        this.router.navigate(['/proveedores']);
      },
      error: (error: HttpErrorResponse) => this.handleSaveError(error),
    });
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  protected hasError(field: keyof typeof this.form.controls, errorKey: string): boolean {
    const control = this.form.controls[field];
    return control.touched && control.hasError(errorKey);
  }

  protected duplicateMessage(): string {
    const duplicate: unknown = this.form.controls.documentNumber.errors?.['duplicate'];
    return typeof duplicate === 'string' ? duplicate : '';
  }

  private loadDocumentTypes(): void {
    this.providerService.getDocumentTypes().subscribe({
      next: (types) => this.allDocumentTypes.set(types),
      error: (error: HttpErrorResponse) =>
        this.error.set(providerErrorMessage(error, 'No se pudieron cargar los tipos de documento')),
    });
  }

  private loadProvider(id: string): void {
    this.loading.set(true);
    this.providerService.getProviderById(id).subscribe({
      next: (provider) => {
        this.currentIdType.set(provider.idType);
        this.form.patchValue({
          providerName: provider.providerName,
          representName: provider.representName,
          idType: provider.idType,
          documentNumber: provider.documentNumber,
          mobileNumber: provider.mobileNumber ?? '',
          address: provider.address ?? '',
          email: provider.email ?? '',
        });
        if (!provider.active) {
          // El backend rechaza editar un proveedor inactivo: se bloquea el formulario.
          this.inactive.set(true);
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(providerErrorMessage(error, 'No se pudo cargar el proveedor'));
      },
    });
  }

  private handleSaveError(error: HttpErrorResponse): void {
    this.saving.set(false);
    const message = providerErrorMessage(
      error,
      this.isEdit ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor',
    );
    if (error.status === 409) {
      // Documento repetido: el aviso del backend se muestra debajo del campo del documento.
      const control = this.form.controls.documentNumber;
      control.setErrors({ duplicate: message });
      control.markAsTouched();
      return;
    }
    this.error.set(
      error.status >= 500
        ? `${message}. Verifica que el número de documento no esté ya registrado.`
        : message,
    );
  }
}
