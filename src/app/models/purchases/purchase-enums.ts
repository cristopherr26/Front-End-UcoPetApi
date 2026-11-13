import { Option } from '../product/catalog-enums';

// Mismos valores que ItemType/PurchaseStatus de la API.
export type ItemType = 'PRODUCT' | 'SERVICE';

export type PurchaseStatus = 'PENDING' | 'LINKED' | 'RECEIVED' | 'CANCELLED';

export type PurchaseTagTone = 'is-ok' | 'is-warn' | 'is-danger' | 'is-info' | 'is-neutral';

export const ITEM_TYPES: Option<ItemType>[] = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
];

export const PURCHASE_STATUSES: Option<PurchaseStatus>[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'RECEIVED', label: 'Recibida' },
  { value: 'LINKED', label: 'Vinculada a egreso' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

export const PURCHASE_STATUS_TONES: Record<PurchaseStatus, PurchaseTagTone> = {
  PENDING: 'is-warn',
  RECEIVED: 'is-ok',
  LINKED: 'is-info',
  CANCELLED: 'is-danger',
};
