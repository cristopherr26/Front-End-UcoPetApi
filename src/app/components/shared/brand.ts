import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand',
  template: `
    <span class="brand" [class.is-inverse]="inverse()" [class.is-small]="small()">
      <span class="brand-mark">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <ellipse cx="12" cy="17" rx="5.4" ry="4.2" />
          <ellipse cx="6.2" cy="11" rx="2.1" ry="2.9" />
          <ellipse cx="9.9" cy="8.4" rx="2.1" ry="2.9" />
          <ellipse cx="14.1" cy="8.4" rx="2.1" ry="2.9" />
          <ellipse cx="17.8" cy="11" rx="2.1" ry="2.9" />
        </svg>
      </span>
      <span class="brand-word">Uco<b>Pet</b></span>
    </span>
  `,
  styles: `
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      background: var(--uc-grad);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .brand-mark svg {
      width: 24px;
      height: 24px;
    }
    .brand-word {
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: -1px;
      color: var(--uc-navy);
    }
    .brand-word b {
      color: var(--uc-blue);
      font-weight: 800;
    }
    .is-small .brand-mark {
      width: 32px;
      height: 32px;
      border-radius: 10px;
    }
    .is-small .brand-mark svg {
      width: 19px;
      height: 19px;
    }
    .is-small .brand-word {
      font-size: 1.25rem;
    }
    .is-inverse .brand-word {
      color: #fff;
    }
    .is-inverse .brand-word b {
      color: #bff3e6;
    }
  `,
})
export class Brand {
  readonly inverse = input(false);
  readonly small = input(false);
}
