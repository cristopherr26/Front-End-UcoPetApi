import { signal } from '@angular/core';

import { compareValues, createTableState } from './table-state';

interface Row {
  name: string;
  price: number | null;
}

describe('createTableState', () => {
  const rows = (count: number): Row[] =>
    Array.from({ length: count }, (_, index) => ({
      name: `Ítem ${index + 1}`,
      price: index % 3 === 0 ? null : index,
    }));

  it('sorts by name with numbers in natural order', () => {
    const source = signal(rows(12));
    const table = createTableState(source, {
      sortKey: 'name',
      accessors: { name: (row) => row.name },
    });
    expect(
      table
        .sorted()
        .slice(0, 3)
        .map((row) => row.name),
    ).toEqual(['Ítem 1', 'Ítem 2', 'Ítem 3']);
    table.toggleSort('name');
    expect(table.sorted()[0].name).toBe('Ítem 12');
  });

  it('keeps empty values last in both directions', () => {
    const source = signal(rows(6));
    const table = createTableState(source, {
      sortKey: 'price',
      accessors: { price: (row) => row.price },
    });
    expect(table.sorted().at(-1)?.price).toBeNull();
    table.toggleSort('price');
    expect(table.sorted().at(-1)?.price).toBeNull();
    expect(table.sorted()[0].price).toBe(5);
  });

  it('pages and goes back to page 1 when the data or the order change', () => {
    const source = signal(rows(23));
    const table = createTableState(source, {
      sortKey: 'name',
      pageSize: 10,
      accessors: { name: (row) => row.name },
    });
    expect(table.rows().length).toBe(10);
    table.page.set(3);
    expect(table.rows().length).toBe(3);
    table.toggleSort('name');
    expect(table.page()).toBe(1);
    table.page.set(2);
    source.set(rows(5));
    expect(table.page()).toBe(1);
    expect(table.total()).toBe(5);
  });

  it('compares accents and case as equal letters', () => {
    expect(compareValues('árbol', 'Arbol')).toBe(0);
  });
});
