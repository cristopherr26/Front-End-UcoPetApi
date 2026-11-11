import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subscription, distinctUntilChanged } from 'rxjs';

export const CONCEPT_MAX = 255;
const AMOUNT_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

export const REFRESH_DELAYS_MS = [1500, 4000];

export const CONCEPT_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(CONCEPT_MAX),
  Validators.pattern(/\S/),
];

export const TOTAL_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.min(0.01),
  Validators.pattern(AMOUNT_PATTERN),
];

export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export const notFutureDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  return value > todayIso() ? { futureDate: true } : null;
};

export function maxTotal(limit: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Number(control.value);
    if (control.value === null || control.value === '' || Number.isNaN(value)) {
      return null;
    }
    return Math.round(value * 100) > Math.round(limit * 100)
      ? { maxTotal: { limit, actual: value } }
      : null;
  };
}

export interface EgressOrderControls {
  provider: FormControl<string>;
  purchaseOrder: FormControl<string>;
  total: FormControl<number | null>;
}

export function bindPurchaseToProvider(
  controls: EgressOrderControls,
  providerOf: (purchaseId: string) => string | null,
  pendingOf: (purchaseId: string) => number,
): Subscription {
  const applyLimit = (purchaseId: string, suggest: boolean) => {
    const rules = purchaseId ? [...TOTAL_RULES, maxTotal(pendingOf(purchaseId))] : TOTAL_RULES;
    controls.total.setValidators(rules);
    if (suggest && purchaseId && controls.total.value === null) {
      controls.total.setValue(pendingOf(purchaseId), { emitEvent: false });
    }
    controls.total.updateValueAndValidity({ emitEvent: false });
  };
  applyLimit(controls.purchaseOrder.value, false);

  const subscription = new Subscription();
  subscription.add(
    controls.provider.valueChanges.pipe(distinctUntilChanged()).subscribe((providerId) => {
      const purchaseId = controls.purchaseOrder.value;
      if (purchaseId && providerOf(purchaseId) !== providerId) {
        controls.purchaseOrder.setValue('');
      }
    }),
  );
  subscription.add(
    controls.purchaseOrder.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((purchaseId) => applyLimit(purchaseId, true)),
  );
  return subscription;
}
