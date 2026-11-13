import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, Subscription, catchError, map, of, shareReplay, switchMap, timer } from 'rxjs';

export const MAX_PRICE = 9_999_999_999_999.99;
export const MAX_QUANTITY = 2_147_483_647;

export const NAME_RULES = Validators.compose([
  Validators.required,
  Validators.maxLength(100),
  Validators.pattern(/\S/),
]);

export const PRICE_RULES = Validators.compose([
  Validators.required,
  Validators.min(0.01),
  Validators.max(MAX_PRICE),
  Validators.pattern(/^\d+(\.\d{1,2})?$/),
]);

export const QUANTITY_RULES = Validators.compose([
  Validators.required,
  Validators.min(1),
  Validators.max(MAX_QUANTITY),
  Validators.pattern(/^\d+$/),
]);

export interface NamedItem {
  id?: string;
  name: string;
}

export function uniqueName(
  existing: Observable<NamedItem[]>,
  currentId: () => string | null,
): AsyncValidatorFn {
  const items = existing.pipe(shareReplay(1));
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(400).pipe(
      switchMap(() => items),
      map((list) => {
        const name = String(control.value ?? '')
          .trim()
          .toLowerCase();
        const taken = list.some(
          (item) => item.id !== currentId() && item.name.trim().toLowerCase() === name,
        );
        return taken ? { nameTaken: true } : null;
      }),
      catchError(() => of(null)),
    );
}

export function bindPriceToSellable(
  sellable: FormControl<boolean>,
  price: FormControl<number | null>,
): Subscription {
  const apply = (isSellable: boolean) => {
    if (isSellable) {
      price.setValidators(PRICE_RULES);
      price.enable({ emitEvent: false });
    } else {
      price.setValidators(Validators.nullValidator);
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

export const MERGE_PATCH_JSON = 'application/merge-patch+json';

export function mergePatch<T extends object>(
  original: T,
  edited: T,
  fields: readonly (keyof T)[],
): Partial<T> {
  const changes: Partial<T> = {};
  for (const field of fields) {
    if (!sameValue(original[field], edited[field])) {
      changes[field] = edited[field];
    }
  }
  return changes;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && [...a].sort().join() === [...b].sort().join();
  }
  return (a ?? null) === (b ?? null);
}
