import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        @if (eyebrow()) {
          <div class="text-uppercase small fw-bold text-body-secondary mb-1 eyebrow">
            {{ eyebrow() }}
          </div>
        }
        <h1 class="h3 mb-1">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-body-secondary mb-0">{{ subtitle() }}</p>
        }
      </div>
      <div class="d-flex flex-wrap gap-2">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .eyebrow {
      letter-spacing: 0.12em;
      font-size: 0.7rem;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
}
