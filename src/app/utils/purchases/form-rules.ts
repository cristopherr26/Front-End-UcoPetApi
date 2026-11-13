import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { PurchaseFilters, Purchase } from '../../models/purchases/purchase.model';
import { PurchaseStatus } from '../../models/purchases/purchase-enums';
import { apiErrorMessage } from '../shared/api-error';

// quantity: entero positivo (Integer @Positive en la API). unitPrice: hasta 2 decimales (@Positive).
export const QUANTITY_PATTERN = /^[1-9]\d*$/;
export const PRICE_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;
export const PURCHASE_NUMBER_MAX = 50;
export const PURCHASE_NUMBER_MIN = 4;

// Tiempo que se le da a ucopet-commercial-processor antes de volver a consultar:
// create y cancel se publican por RabbitMQ, la persistencia real ocurre al consumir el mensaje.
export const PROCESSOR_DELAY_MS = 1500;

export const QUANTITY_RULES = [Validators.required, Validators.pattern(QUANTITY_PATTERN)];
export const PRICE_RULES = [Validators.required, Validators.pattern(PRICE_PATTERN)];

// Validador de FormArray: al menos un ítem, igual que en procedimientos.
export const ITEMS_MIN_RULE: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const length = (control.value as unknown[] | null)?.length ?? 0;
  return length === 0 ? { minlength: true } : null;
};

// No repetir el mismo producto/servicio en dos filas de la misma compra.
export const uniqueItemsValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const items = (control.value as { productId?: string }[] | null) ?? [];
  const ids = items.map((item) => item.productId).filter((id): id is string => !!id);
  return new Set(ids).size !== ids.length ? { duplicateItems: true } : null;
};

export function canReceive(purchase: Purchase): boolean {
  return purchase.status === 'PENDING';
}

export function canCancel(purchase: Purchase): boolean {
  return purchase.status === 'PENDING' || purchase.status === 'RECEIVED';
}

export function canLinkExpense(purchase: Purchase): boolean {
  return purchase.status === 'RECEIVED';
}

export function toApiFilters(
  headquarterId: string,
  status: PurchaseStatus | null,
  supplierId: string | null,
): PurchaseFilters {
  return { headquarterId, status, supplierId };
}

export function purchaseErrorMessage(error: HttpErrorResponse, fallback: string): string {
  return apiErrorMessage(error, fallback);
}
