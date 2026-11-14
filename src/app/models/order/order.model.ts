// Estados posibles de una orden de procedimiento
export type OrderState = 'PENDING' | 'AUTHORIZED' | 'DENIED';

// Orden consultada (igual al OrderDTO del backend)
export interface Order {
  id: string;
  idOrder: number;
  // Id de la PERSONA del tutor (no el id de TutorPet)
  tutorId: string;
  petId: string;
  procedureId: string;
  state: OrderState;
  // LocalDateTime sin zona (hora de Bogotá), ej. "2026-11-10T09:30:00"
  date: string;
  isAuthorized: boolean;
}

// POST /orders: solo los tres ids; el backend pone id, estado, fecha y autorización
export interface CreateOrderRequest {
  tutorId: string;
  petId: string;
  procedureId: string;
}

// PATCH /orders/{id}/procedure
export interface ChangeProcedureRequest {
  procedureId: string;
}

// PATCH /orders/{id}/authorize (siempre explícito: sin el campo el backend responde 500)
export interface AuthorizeOrderRequest {
  isAuthorized: boolean;
}

// Etiqueta y clase uc-tag de cada estado
export const ORDER_STATES: { value: OrderState; label: string; tag: string }[] = [
  { value: 'PENDING', label: 'Pendiente', tag: 'is-warn' },
  { value: 'AUTHORIZED', label: 'Autorizada', tag: 'is-ok' },
  { value: 'DENIED', label: 'Denegada', tag: 'is-danger' },
];
