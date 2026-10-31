import { Component, computed, input } from '@angular/core';

import { TableState } from '../../utils/shared/table-state';

@Component({
  selector: 'th[appSortHeader]',
  host: {
    '[attr.aria-sort]': 'ariaSort()',
    '[class.is-sorted]': 'active()',
  },
  template: `
    <button
      type="button"
      class="sort-button"
      [class.justify-content-end]="end()"
      (click)="table().toggleSort(appSortHeader())"
    >
      <ng-content />
      <i
        class="bi sort-icon"
        [class.bi-arrow-up]="active() && direction() === 'asc'"
        [class.bi-arrow-down]="active() && direction() === 'desc'"
        [class.bi-arrow-down-up]="!active()"
      ></i>
    </button>
  `,
  styles: `
    .sort-button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
    }
    .sort-button:hover {
      color: var(--uc-navy);
    }
    .sort-icon {
      font-size: 0.8rem;
      opacity: 0.35;
    }
    :host(.is-sorted) {
      color: var(--uc-blue) !important;
    }
    :host(.is-sorted) .sort-icon {
      opacity: 1;
    }
  `,
})
export class SortHeader {
  readonly appSortHeader = input.required<string>();
  readonly table = input.required<TableState<unknown>>();
  readonly end = input(false);

  protected readonly active = computed(() => this.table().sort().key === this.appSortHeader());
  protected readonly direction = computed(() => this.table().sort().direction);
  protected readonly ariaSort = computed(() =>
    this.active() ? (this.direction() === 'asc' ? 'ascending' : 'descending') : 'none',
  );
}
