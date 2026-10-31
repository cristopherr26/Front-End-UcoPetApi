import {
  labelOf,
  Option,
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  STOCK_MOVEMENT_REASONS,
  StockMovementReason,
  TAX_CATEGORIES,
  TaxCategory,
} from '../../models/product/catalog-enums';

export function taxLabel(taxCategory: TaxCategory): string {
  return labelOf(TAX_CATEGORIES, taxCategory);
}

export function productCategoryLabel(category: string): string {
  return labelOf(PRODUCT_CATEGORIES as Option<string>[], category);
}

export function serviceCategoryLabel(category: string): string {
  return labelOf(SERVICE_CATEGORIES as Option<string>[], category);
}

export function reasonLabel(reason: StockMovementReason): string {
  return labelOf(STOCK_MOVEMENT_REASONS, reason);
}
