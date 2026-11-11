import { PayMethod } from '../receipts/receipt.model';

export type { PayMethod };

export interface Egress {
  id: string;
  date: string;
  provider: string;
  payMethod: string;
  purchaseOrder: string;
  concept: string;
  total: number;
}

export interface EgressRequest {
  date: string;
  provider: string;
  payMethod: string;
  purchaseOrder: string;
  concept: string;
  total: number;
}

export interface EgressView extends Egress {
  providerName: string;
  payMethodName: string;
  purchaseNumber: string;
}

export interface ProviderResponse {
  id: string;
  providerName: string;
  active: boolean;
}

export interface ProviderOption {
  id: string;
  name: string;
  active: boolean;
}

export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'LINKED' | 'CANCELLED';

export interface PurchaseResponse {
  id: string;
  purchaseNumber: string;
  supplier: { id: string; name: string } | null;
  headquarter: { id: string; name: string } | null;
  total: number;
  status: PurchaseStatus;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
}

export interface PurchaseOption {
  id: string;
  number: string;
  providerId: string;
  headquarterName: string;
  total: number;
  status: PurchaseStatus;
}

export interface EgressCatalog {
  egresses: EgressView[];
  providers: ProviderOption[];
  purchases: PurchaseOption[];
  payMethods: PayMethod[];
}

export interface EgressFilters {
  search: string;
  providerId: string | null;
  payMethodId: string | null;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: EgressFilters = {
  search: '',
  providerId: null,
  payMethodId: null,
  dateFrom: '',
  dateTo: '',
};
