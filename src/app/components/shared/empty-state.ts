import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="text-center text-body-secondary py-5 px-3">
      <i class="bi d-block mb-2 fs-1 opacity-50" [class]="icon()"></i>
      <div class="fw-bold text-body">{{ title() }}</div>
      @if (text()) {
        <div class="small mt-1">{{ text() }}</div>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input('bi-inbox');
  readonly title = input.required<string>();
  readonly text = input<string | null>(null);
}
