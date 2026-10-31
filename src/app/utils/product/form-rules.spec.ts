import { FormControl } from '@angular/forms';

import { NAME_RULES, PRICE_RULES, bindPriceToSellable } from './form-rules';

describe('form rules', () => {
  const name = (value: string) => new FormControl(value, NAME_RULES).valid;
  const price = (value: number | null) => new FormControl(value, PRICE_RULES).valid;

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

  it('clears and disables the price when the item is not sellable', () => {
    const sellable = new FormControl(true, { nonNullable: true });
    const value = new FormControl<number | null>(1500.555);
    const subscription = bindPriceToSellable(sellable, value);
    expect(value.valid).toBe(false);
    sellable.setValue(false);
    expect(value.value).toBeNull();
    expect(value.disabled).toBe(true);
    subscription.unsubscribe();
  });
});
