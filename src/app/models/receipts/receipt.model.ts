export type ReceiptState = 'ACTIVE' | 'CANCELLED';

export const RECEIPT_STATES: { value: ReceiptState; label: string }[] = [
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'CANCELLED', label: 'Anulados' },
];

/** Lo que responde GET /api/v1/receipts (ReceiptResponseDTO de la API). */
export interface Receipt {
  id: string;
  receiptNumber: string;
  tutorId: string;
  petId: string | null;
  concept: string;
  amount: number;
  payMethodId: string;
  payMethodName: string;
  date: string;
  state: ReceiptState;
}

/** Lo que se envía en POST y PUT /api/v1/receipts (ReceiptRequestDTO de la API). */
export interface ReceiptRequest {
  tutorId: string;
  petId: string | null;
  concept: string;
  amount: number;
  payMethodId: string;
  date: string | null;
}

/** Lo que responde la API (202) al crear, editar o anular: el recibo lo guarda el processor después. */
export interface ReceiptAccepted {
  receiptId: string;
  idMensaje: string;
}

/** GET /api/v1/PayMethods */
export interface PayMethod {
  id: string;
  name: string;
}

/** Tutor listo para mostrar: `id` es el que guarda el recibo en `tutorId`. */
export interface TutorOption {
  id: string;
  name: string;
}

/** Mascota lista para mostrar y para filtrar por tutor. */
export interface PetOption {
  id: string;
  name: string;
  tutorId: string;
  active: boolean;
}
