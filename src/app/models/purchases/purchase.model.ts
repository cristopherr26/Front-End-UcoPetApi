import { ItemType, PurchaseStatus } from './purchase-enums';
import { TaxCategory } from '../product/catalog-enums';

// RelatedEntityDTO de la API: id + nombre ya resuelto (null si el back no pudo resolverlo).
export interface RelatedEntity {
  id: string;
  name: string | null;
}

// PurchaseResponseDTO.Item.
export interface PurchaseItem {
  catalogItem: RelatedEntity;
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Lo que responde GET /api/v1/purchases y GET /api/v1/purchases/{id} (PurchaseResponseDTO).
export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: RelatedEntity;
  items: PurchaseItem[];
  purchaseDate: string;
  subtotal: number;
  totalTaxes: number;
  total: number;
  status: PurchaseStatus;
  expenseId: string | null;
  headquarter: RelatedEntity;
  hasDiscount: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: RelatedEntity;
  updatedBy: RelatedEntity;
}

// Query params de GET /api/v1/purchases. headquarterId es obligatorio en la API.
export interface PurchaseFilters {
  headquarterId: string;
  status?: PurchaseStatus | null;
  supplierId?: string | null;
  page?: number;
  size?: number;
}

// Page<PurchaseResponseDTO> de Spring Data; solo tipamos lo que usamos.
export interface PurchasePage {
  content: Purchase[];
  totalElements: number;
}

// PurchaseItemRequestDTO.
export interface CreatePurchaseItemRequest {
  productId: string;
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  taxCategory: TaxCategory;
}

// PurchaseRequestDTO (cuerpo de POST /api/v1/purchases).
export interface CreatePurchaseRequest {
  purchaseNumber: string;
  supplierId: string;
  headquarterId: string;
  hasDiscount: boolean;
  items: CreatePurchaseItemRequest[];
}

// LinkExpenseRequestDTO.
export interface LinkExpenseRequest {
  expenseId: string;
}

// Opción de proveedor para el desplegable del formulario de compra.
// Se consulta GET /api/v1/providers directamente desde purchases;
// no depende del módulo "provider" (que es de otro equipo).
export interface PurchaseSupplierOption {
  id: string;
  providerName: string;
  // OJO: el backend de providers serializa este campo como "active" (no "isActive"),
  // por una inconsistencia entre ProviderDTO y HeadquarterDTO (getter isActive() vs
  // getIsActive()). Se deja asi, apuntando al nombre real que llega por HTTP, en vez de
  // tocar el modulo "provider" (de otro equipo) para corregirlo alla.
  active: boolean;
}
