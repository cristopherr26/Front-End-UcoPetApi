import { Component, computed, input, model } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-table-pager',
  imports: [NgbPagination],
  template: `
    @if (total() > 0) {
      <div class="pager">
        <div class="small text-body-secondary">
          Mostrando <b class="text-body">{{ from() }}–{{ to() }}</b> de
          <b class="text-body">{{ total() }}</b>
        </div>
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <label class="d-flex align-items-center gap-2 small text-body-secondary mb-0">
            Filas
            <select
              class="form-select form-select-sm w-auto"
              aria-label="Filas por página"
              (change)="pageSize.set(+$any($event.target).value)"
            >
              @for (size of sizes(); track size) {
                <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
              }
            </select>
          </label>
          @if (total() > pageSize()) {
            <ngb-pagination
              size="sm"
              class="d-flex"
              [collectionSize]="total()"
              [pageSize]="pageSize()"
              [page]="page()"
              (pageChange)="page.set($event)"
              [maxSize]="5"
              [rotate]="true"
              [ellipses]="true"
              [boundaryLinks]="true"
              aria-label="Paginación"
            />
          }
        </div>
      </div>
    }
  `,
  styles: `
    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--uc-line);
      background: #fafbfe;
    }
    :host ::ng-deep .pagination {
      margin: 0;
    }
  `,
})
export class TablePager {
  readonly total = input.required<number>();
  readonly page = model.required<number>();
  readonly pageSize = model.required<number>();
  readonly sizes = input([10, 25, 50]);

  protected readonly from = computed(() =>
    Math.min(this.total(), (this.page() - 1) * this.pageSize() + 1),
  );
  protected readonly to = computed(() => Math.min(this.total(), this.page() * this.pageSize()));
}
