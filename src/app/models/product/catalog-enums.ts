export type TaxCategory = 'STANDARD' | 'REDUCED' | 'EXEMPT';

export type ProductCategory =
  'GENERAL' | 'MEDICATION' | 'VACCINE' | 'FOOD' | 'ACCESSORY' | 'HYGIENE' | 'SUPPLY';

export type ServiceCategory =
  | 'GENERAL'
  | 'CONSULTATION'
  | 'VACCINATION'
  | 'SURGERY'
  | 'GROOMING'
  | 'LABORATORY'
  | 'HOSPITALIZATION';

export type CatalogItemType = 'PRODUCT' | 'SERVICE';

export type StockMovementReason =
  | 'OPENING'
  | 'ADJUSTMENT'
  | 'COUNT'
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'DISPENSE'
  | 'LOSS';

export interface Option<T> {
  value: T;
  label: string;
}

export const TAX_CATEGORIES: Option<TaxCategory>[] = [
  { value: 'STANDARD', label: 'General (19 %)' },
  { value: 'REDUCED', label: 'Reducido (5 %)' },
  { value: 'EXEMPT', label: 'Exento' },
];

export const PRODUCT_CATEGORIES: Option<ProductCategory>[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'MEDICATION', label: 'Medicamento' },
  { value: 'VACCINE', label: 'Vacuna' },
  { value: 'FOOD', label: 'Alimento' },
  { value: 'ACCESSORY', label: 'Accesorio' },
  { value: 'HYGIENE', label: 'Higiene' },
  { value: 'SUPPLY', label: 'Insumo' },
];

export const SERVICE_CATEGORIES: Option<ServiceCategory>[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'CONSULTATION', label: 'Consulta' },
  { value: 'VACCINATION', label: 'Vacunación' },
  { value: 'SURGERY', label: 'Cirugía' },
  { value: 'GROOMING', label: 'Peluquería' },
  { value: 'LABORATORY', label: 'Laboratorio' },
  { value: 'HOSPITALIZATION', label: 'Hospitalización' },
];

export const STOCK_MOVEMENT_REASONS: Option<StockMovementReason>[] = [
  { value: 'OPENING', label: 'Saldo inicial' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'COUNT', label: 'Conteo físico' },
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'TRANSFER_OUT', label: 'Traslado (salida)' },
  { value: 'TRANSFER_IN', label: 'Traslado (entrada)' },
  { value: 'DISPENSE', label: 'Dispensación' },
  { value: 'LOSS', label: 'Pérdida' },
];

export const INCOMING_REASONS: StockMovementReason[] = [
  'PURCHASE',
  'RETURN',
  'TRANSFER_IN',
  'ADJUSTMENT',
  'COUNT',
];

export const OUTGOING_REASONS: StockMovementReason[] = [
  'SALE',
  'TRANSFER_OUT',
  'DISPENSE',
  'LOSS',
  'ADJUSTMENT',
  'COUNT',
];

export function labelOf<T>(options: Option<T>[], value: T | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? String(value ?? '');
}
