import { Signal, WritableSignal, computed, linkedSignal, signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | boolean | null | undefined;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface TableOptions<T> {
  sortKey: string;
  direction?: SortDirection;
  pageSize?: number;
  accessors: Record<string, (item: T) => SortValue>;
}

export interface TableState<T> {
  sort: WritableSignal<SortState>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  total: Signal<number>;
  sorted: Signal<T[]>;
  rows: Signal<T[]>;
  toggleSort(key: string): void;
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export function compareValues(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty || bEmpty) {
    return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(b) - Number(a);
  }
  return collator.compare(String(a), String(b));
}

export function createTableState<T>(source: Signal<T[]>, options: TableOptions<T>): TableState<T> {
  const sort = signal<SortState>({ key: options.sortKey, direction: options.direction ?? 'asc' });
  const pageSize = signal(options.pageSize ?? 10);

  const sorted = computed(() => {
    const { key, direction } = sort();
    const accessor = options.accessors[key];
    const items = [...source()];
    if (!accessor) {
      return items;
    }
    const factor = direction === 'asc' ? 1 : -1;
    return items.sort((a, b) => {
      const valueA = accessor(a);
      const valueB = accessor(b);
      const emptyA = valueA === null || valueA === undefined || valueA === '';
      const emptyB = valueB === null || valueB === undefined || valueB === '';
      return emptyA || emptyB
        ? compareValues(valueA, valueB)
        : compareValues(valueA, valueB) * factor;
    });
  });

  const page = linkedSignal({
    source: () => ({ items: source(), sort: sort(), size: pageSize() }),
    computation: () => 1,
  });

  const rows = computed(() => {
    const size = pageSize();
    const start = (page() - 1) * size;
    return sorted().slice(start, start + size);
  });

  return {
    sort,
    page,
    pageSize,
    total: computed(() => source().length),
    sorted,
    rows,
    toggleSort(key: string): void {
      sort.update((current) =>
        current.key === key
          ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' },
      );
    },
  };
}
