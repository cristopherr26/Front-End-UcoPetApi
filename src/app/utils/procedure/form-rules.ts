import { FormArray, ValidatorFn, Validators } from '@angular/forms';

export const TYPE_RULES = [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100)
];

export const DESCRIPTION_RULES = [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(500)
];

export const DURATION_RULES = [
    Validators.required,
    Validators.min(1),
    Validators.max(1440),
    Validators.pattern(/^\d+$/)
];

export const QUANTITY_RULES = [
    Validators.required,
    Validators.min(1),
    Validators.pattern(/^\d+$/)
];

// El backend exige al menos un ítem
// (Validators.minLength ignora los arreglos vacíos, por eso uso uno propio)
export const ITEMS_MIN_RULE: ValidatorFn = (control) =>
    (control as FormArray).length > 0 ? null : { minlength: true };

// El backend no permite repetir un ítem
export const uniqueItemsValidator: ValidatorFn = (control) => {

    const ids = (control as FormArray).controls
    .map((group) => group.get('itemId')?.value as string)
    .filter((id) => !!id);

    return new Set(ids).size === ids.length
    ? null
    : { duplicateItems: true };

};

export function trimValue(value: string): string {
    return value.trim();
}