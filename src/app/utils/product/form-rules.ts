import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

export function bindPriceToSellable(
  sellable: FormControl<boolean>,
  price: FormControl<number | null>,
): Subscription {
  const apply = (isSellable: boolean) => {
    if (isSellable) {
      price.setValidators([Validators.required, Validators.min(1)]);
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
