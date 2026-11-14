
export type ReceiptState = 'ACTIVE' | 'CANCELLED';

export const RECEIPT_STATES: { value: ReceiptState; label: string }[] = [
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'CANCELLED', label: 'Anulados' },
];

/** Respuesta de GET /api/v1/receipts. */
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

/** Datos enviados en POST y PUT /api/v1/receipts. */
export interface ReceiptRequest {
  tutorId: string;
  petId: string | null;
  concept: string;
  amount: number;
  payMethodId: string;
  date: string | null;
}

/** Respuesta HTTP 202 al crear, editar o anular un recibo. */
export interface ReceiptAccepted {
  receiptId: string;
  idMessage: string;
}

/** Métodos de pago disponibles. */
export interface PayMethod {
  id: string;
  name: string;
}

/** Tutor asociado a un recibo. */
export interface TutorOption {
  id: string;
  name: string;
  active?: boolean;
}

/** Mascota asociada a un tutor. */
export interface PetOption {
  id: string;
  name: string;
  breed: string;
  tutorId: string;
  active: boolean;
}
