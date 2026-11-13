import { FormControl } from '@angular/forms';

import {
  CONCEPT_RULES,
  TOTAL_RULES,
  bindPurchaseToProvider,
  maxTotal,
  notFutureDate,
  todayIso,
} from './form-rules';

describe('egress form rules', () => {
  it('formats the local date as yyyy-MM-dd', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('rejects future dates, like the API', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(new FormControl(todayIso(), notFutureDate).valid).toBe(true);
    expect(new FormControl(todayIso(tomorrow), notFutureDate).valid).toBe(false);
    expect(new FormControl('', notFutureDate).valid).toBe(true);
  });

  it('requires a concept with text', () => {
    expect(new FormControl('Pago de vacunas', CONCEPT_RULES).valid).toBe(true);
    expect(new FormControl('   ', CONCEPT_RULES).valid).toBe(false);
    expect(new FormControl('a'.repeat(256), CONCEPT_RULES).valid).toBe(false);
  });

  it('accepts a total above zero with up to 2 decimals', () => {
    const total = (value: number | null) => new FormControl(value, TOTAL_RULES).valid;
    expect(total(150000)).toBe(true);
    expect(total(0.01)).toBe(true);
    expect(total(10.555)).toBe(false);
    expect(total(0)).toBe(false);
    expect(total(null)).toBe(false);
  });

  it('does not let the total exceed the pending balance', () => {
    expect(new FormControl(100, maxTotal(100)).valid).toBe(true);
    expect(new FormControl(100.01, maxTotal(100)).valid).toBe(false);
  });

  it('clears the order when the provider changes and suggests the pending balance', () => {
    const controls = {
      provider: new FormControl('prov-1', { nonNullable: true }),
      purchaseOrder: new FormControl('', { nonNullable: true }),
      total: new FormControl<number | null>(null),
    };
    const subscription = bindPurchaseToProvider(
      controls,
      (purchaseId) => (purchaseId === 'oc-1' ? 'prov-1' : null),
      () => 500,
    );

    controls.purchaseOrder.setValue('oc-1');
    expect(controls.total.value).toBe(500);

    controls.total.setValue(600);
    expect(controls.total.valid).toBe(false);

    controls.provider.setValue('prov-2');
    expect(controls.purchaseOrder.value).toBe('');
    expect(controls.total.valid).toBe(true);

    subscription.unsubscribe();
  });
});
