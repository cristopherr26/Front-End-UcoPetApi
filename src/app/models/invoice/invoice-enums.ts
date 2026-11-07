import { Option } from '../product/catalog-enums';

// Mismos valores que el enum InvoiceState de la API. SIN_ESTADO es interno del back y no se muestra.
export type InvoiceState = 'PENDIENTE' | 'PARCIALMENTE_PAGADA' | 'PAGADA' | 'ANULADA';

export type InvoiceTagTone = 'is-ok' | 'is-warn' | 'is-danger' | 'is-info' | 'is-neutral';

export const INVOICE_STATES: Option<InvoiceState>[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PARCIALMENTE_PAGADA', label: 'Pago parcial' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'ANULADA', label: 'Anulada' },
];

export const INVOICE_STATE_TONES: Record<InvoiceState, InvoiceTagTone> = {
  PENDIENTE: 'is-warn',
  PARCIALMENTE_PAGADA: 'is-info',
  PAGADA: 'is-ok',
  ANULADA: 'is-danger',
};
