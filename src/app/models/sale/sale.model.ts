import { TaxCategory } from '../product/catalog-enums';

export type SaleOrderState =
  'BORRADOR'  |
  'FACTURADA' |
  'ANULADA'   |
  'SIN_ESTADO';
export type SaleItemType =
  'PRODUCTO' |
  'SERVICIO';

export interface SaleItem {
  id: string;
  saleOrderId: string;
  itemId: string;
  itemType: SaleItemType;
  taxCategory: TaxCategory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleOrder {
  id: string;
  headquarterId: string;
  orderNumber: string;
  saleDate: string;
  clientID: string;
  petId: string;
  healthPlanId: string | null;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  totalTaxes: number;
  total: number;
  comment: string;
  state: SaleOrderState;
}

export interface SaleOrderRequest {
  headquarterId: string;
  clientID: string;
  petId: string;
  healthPlanId?: string;
  comment: string;
}

export interface SaleOrderFilters {
  headquarterId?: string | null;
  clientID?: string | null;
  petId?: string | null;
  healthPlanId?: string | null;
  orderNumber?: string | null;
  state?: SaleOrderState | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface AddSaleItemRequest {
  itemId: string;
  itemType: SaleItemType;
  quantity: number;
  unitPrice: number;
}

export interface EditSaleItemRequest {
  quantity: number;
  unitPrice: number;
}
