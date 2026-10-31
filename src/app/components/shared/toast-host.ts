import { Component, inject } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

import { ToastKind, ToastService } from '../../services/shared/toast.service';

const ICONS: Record<ToastKind, string> = {
  success: 'bi-check-circle-fill',
  danger: 'bi-x-octagon-fill',
  info: 'bi-info-circle-fill',
};

@Component({
  selector: 'app-toast-host',
  imports: [NgbToast],
  styles: `
    .toast-stack {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `,
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <ngb-toast
          [class]="'border-0 text-bg-' + toast.kind"
          [autohide]="true"
          [delay]="5000"
          (hidden)="toastService.remove(toast.id)"
        >
          <div class="d-flex align-items-start gap-2">
            <i class="bi {{ icons[toast.kind] }} mt-1"></i>
            <span class="flex-grow-1">{{ toast.text }}</span>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Cerrar"
              (click)="toastService.remove(toast.id)"
            ></button>
          </div>
        </ngb-toast>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = ICONS;
}
