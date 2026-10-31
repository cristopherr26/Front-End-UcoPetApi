import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

export const NAME_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(100),
  Validators.pattern(/\S/),
];

export const PRICE_RULES: ValidatorFn[] = [
  Validators.required,
  Validators.min(0.01),
  Validators.pattern(/^\d{1,13}(\.\d{1,2})?$/),
];

export function bindPriceToSellable(
  sellable: FormControl<boolean>,
  price: FormControl<number | null>,
): Subscription {
  const apply = (isSellable: boolean) => {
    if (isSellable) {
      price.setValidators(PRICE_RULES);
      price.enable({ emitEvent: false });
    } else {
      price.clearValidators();
      price.setValue(null, { emitEvent: false });
      price.disable({ emitEvent: false });
    }
    price.updateValueAndValidity({ emitEvent: false });
  };
  apply(sellable.value);
  return sellable.valueChanges.subscribe(apply);
}

export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}
