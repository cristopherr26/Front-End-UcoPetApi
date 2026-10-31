import { Component, input, output } from '@angular/core';

export type ModalTone = 'primary' | 'grad' | 'teal' | 'warn' | 'danger';

@Component({
  selector: 'app-modal-frame',
  styles: `
    :host {
      display: contents;
    }
    .frame-title {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
  `,
  template: `
    <div class="modal-header align-items-start gap-3">
      <span [class]="'uc-mark is-' + tone()"><i class="bi" [class]="icon()"></i></span>
      <div class="flex-grow-1">
        <h2 class="modal-title frame-title mb-0">{{ title() }}</h2>
        @if (subtitle()) {
          <div class="small text-body-secondary fw-semibold">{{ subtitle() }}</div>
        }
      </div>
      <button type="button" class="btn-close" aria-label="Cerrar" (click)="closed.emit()"></button>
    </div>
    <div class="modal-body">
      <ng-content />
    </div>
    <div class="modal-footer">
      <ng-content select="[modalFooter]" />
    </div>
  `,
})
export class ModalFrame {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly icon = input('bi-pencil-square');
  readonly tone = input<ModalTone>('primary');
  readonly closed = output<void>();
}
