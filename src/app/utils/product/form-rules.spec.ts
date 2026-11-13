import { FormControl } from '@angular/forms';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

import {
  NAME_RULES,
  NamedItem,
  PRICE_RULES,
  QUANTITY_RULES,
  bindPriceToSellable,
  mergePatch,
  uniqueName,
} from './form-rules';

describe('form rules', () => {
  const name = (value: string) => new FormControl(value, NAME_RULES).valid;
  const price = (value: number | null) => new FormControl(value, PRICE_RULES).valid;
  const quantity = (value: number | null) => new FormControl(value, QUANTITY_RULES).valid;

  it('rejects a name made only of spaces, like the API', () => {
    expect(name('Collar')).toBe(true);
    expect(name('')).toBe(false);
    expect(name('   ')).toBe(false);
    expect(name('a'.repeat(101))).toBe(false);
  });

  it('accepts a price above zero with up to 2 decimals, like the API', () => {
    expect(price(25000)).toBe(true);
    expect(price(1500.5)).toBe(true);
    expect(price(0.01)).toBe(true);
    expect(price(1500.555)).toBe(false);
    expect(price(0)).toBe(false);
    expect(price(-10)).toBe(false);
    expect(price(null)).toBe(false);
    expect(price(12345678901234)).toBe(false);
  });

  it('accepts a whole quantity that fits in the API integer', () => {
    expect(quantity(5)).toBe(true);
    expect(quantity(2147483647)).toBe(true);
    expect(quantity(2147483648)).toBe(false);
    expect(quantity(0)).toBe(false);
    expect(quantity(1.5)).toBe(false);
  });

  it('clears and disables the price when the item is not sellable', () => {
    const sellable = new FormControl(true, { nonNullable: true });
    const value = new FormControl<number | null>(1500.555);
    const subscription = bindPriceToSellable(sellable, value);
    expect(value.valid).toBe(false);
    sellable.setValue(false);
    expect(value.value).toBeNull();
    expect(value.disabled).toBe(true);
    expect(value.errors).toBeNull();
    subscription.unsubscribe();
  });

  describe('uniqueName', () => {
    const existing = of<NamedItem[]>([
      { id: '1', name: 'Collar Azul' },
      { id: '2', name: 'Antipulgas' },
    ]);
    const check = (value: string, currentId: string | null, items = existing) =>
      firstValueFrom(
        uniqueName(items, () => currentId)(new FormControl(value)) as Observable<unknown>,
      );

    it('marks a name already used, without caring about case or spaces', async () => {
      expect(await check('  collar azul ', null)).toEqual({ nameTaken: true });
      expect(await check('Collar Rojo', null)).toBeNull();
    });

    it('lets an item keep its own name when it is edited', async () => {
      expect(await check('Collar Azul', '1')).toBeNull();
      expect(await check('Collar Azul', '2')).toEqual({ nameTaken: true });
    });

    it('leaves the decision to the API when the list cannot be read', async () => {
      expect(
        await check(
          'Collar Azul',
          null,
          throwError(() => new Error('500')),
        ),
      ).toBeNull();
    });
  });

  describe('mergePatch', () => {
    interface Item {
      name: string;
      description: string | null;
      price: number | null;
      active?: boolean;
      headquarterIds: string[];
    }
    const fields: (keyof Item)[] = ['name', 'description', 'price', 'headquarterIds'];
    const original: Item = {
      name: 'Collar',
      description: 'De cuero',
      price: 25000,
      active: true,
      headquarterIds: ['a', 'b'],
    };

    it('sends only what changed', () => {
      expect(mergePatch(original, { ...original, price: 12000.5 }, fields)).toEqual({ price: 12000.5 });
    });

    it('sends null to clear a field', () => {
      expect(mergePatch(original, { ...original, description: null }, fields)).toEqual({
        description: null,
      });
    });

    it('sends nothing when nothing changed, even if the list comes in another order', () => {
      expect(mergePatch(original, { ...original, headquarterIds: ['b', 'a'] }, fields)).toEqual({});
    });

    it('sends the whole list when it changed', () => {
      expect(mergePatch(original, { ...original, headquarterIds: ['a'] }, fields)).toEqual({
        headquarterIds: ['a'],
      });
    });

    it('never sends a field that is not in the list', () => {
      expect(mergePatch(original, { ...original, active: false }, fields)).toEqual({});
    });
  });
});
