import { StockMovementReason } from './catalog-enums';

export interface Stock {
  id?: string;
  productId: string;
  headquarterId: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  headquarterId: string;
  quantity: number;
  balanceAfter: number;
  reason: StockMovementReason;
  note: string | null;
  performedBy: string | null;
  occurredAt: string;
}

export interface StockAdjustment {
  productId: string;
  headquarterId: string;
  quantity: number;
  reason: StockMovementReason;
  note: string | null;
}
