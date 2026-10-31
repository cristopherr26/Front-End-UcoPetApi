import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="modal-body text-center p-4">
      <span class="uc-mark is-lg is-danger mb-3"
        ><i class="bi bi-exclamation-triangle-fill"></i
      ></span>
      <h2 class="h5 mb-2">{{ title() }}</h2>
      <p class="text-body-secondary mb-0">{{ message() }}</p>
    </div>
    <div class="modal-footer justify-content-center">
      <button type="button" class="btn btn-light" (click)="modal.dismiss()">Cancelar</button>
      <button type="button" class="btn btn-danger" (click)="modal.close(true)">
        {{ confirmLabel() }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly modal = inject(NgbActiveModal);
  readonly title = signal('');
  readonly message = signal('');
  readonly confirmLabel = signal('Confirmar');
}
