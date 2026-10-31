import { Component, input } from '@angular/core';

export type KpiTone = 'default' | 'warn' | 'danger' | 'ok';

@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="kpi h-100">
      <span class="kpi-label">{{ label() }}</span>
      <span
        class="kpi-value"
        [class.text-warning]="tone() === 'warn'"
        [class.text-danger]="tone() === 'danger'"
        [class.text-success]="tone() === 'ok'"
      >
        @if (value() === null) {
          <span class="text-body-tertiary">—</span>
        } @else {
          {{ value() }}
        }
      </span>
      @if (hint()) {
        <span class="kpi-hint">{{ hint() }}</span>
      }
      @if (scope()) {
        <span class="kpi-scope">{{ scope() }}</span>
      }
    </div>
  `,
  styles: `
    .kpi {
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid var(--uc-line);
      border-radius: 1rem;
      padding: 1rem 1.15rem;
    }
    .kpi-label {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #9ba0bf;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: -1.2px;
      line-height: 1;
    }
    .kpi-hint {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--uc-ink);
      margin-top: 0.45rem;
    }
    .kpi-scope {
      align-self: flex-start;
      font-size: 0.63rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #a8aec9;
      border: 1px solid var(--uc-line);
      border-radius: 0.4rem;
      padding: 0.1rem 0.4rem;
      margin-top: 0.5rem;
    }
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly hint = input<string | null>(null);
  readonly scope = input<string | null>(null);
  readonly tone = input<KpiTone>('default');
}
