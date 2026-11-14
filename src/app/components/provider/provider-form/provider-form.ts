import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModalFrame } from '../../shared/modal-frame';
import { PROVIDER_ALLOWED_DOCUMENT_TYPES } from '../../../models/provider/provider-enums';
import { DocumentTypeOption, Provider } from '../../../models/provider/provider.model';
import { ProviderService } from '../../../services/provider/provider.service';
import { PROVIDER_RULES } from '../../../utils/provider/form-rules';
import { providerErrorMessage } from '../../../utils/provider/provider-error';
import { toProviderPayload } from '../../../utils/provider/provider-payload';

// Modal que sirve para crear y para editar. ProviderDialogs lo abre; si se edita, llama a edit()
// con el proveedor de la fila. Al guardar se cierra devolviendo el proveedor enviado.
@Component({
  selector: 'app-provider-form',
  imports: [ReactiveFormsModule, ModalFrame],
  templateUrl: './provider-form.html',
})
export class ProviderForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly providerService = inject(ProviderService);
  protected readonly modal = inject(NgbActiveModal);

  protected readonly form = this.fb.group({
    providerName: ['', PROVIDER_RULES.providerName],
    representName: ['', PROVIDER_RULES.representName],
    idType: ['', PROVIDER_RULES.idType],
    documentNumber: ['', PROVIDER_RULES.documentNumber],
    mobileNumber: ['', PROVIDER_RULES.mobileNumber],
    address: ['', PROVIDER_RULES.address],
    email: ['', PROVIDER_RULES.email],
  });

  // Id del proveedor en edición; null cuando se está creando.
  protected readonly providerId = signal<string | null>(null);

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
  }

  // Precarga los datos de la fila para editar (la lista ya los tiene, no hace falta otro GET).
  edit(provider: Provider): void {
    this.providerId.set(provider.id);
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

    const id = this.providerId();
    const request = id
      ? this.providerService.updateProvider(id, payload)
      : this.providerService.createProvider(payload);

    request.subscribe({
      next: (saved) => this.modal.close(saved),
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

  private handleSaveError(error: HttpErrorResponse): void {
    this.saving.set(false);
    const message = providerErrorMessage(
      error,
      this.providerId() ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor',
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
