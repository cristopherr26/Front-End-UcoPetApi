import { InvoiceState } from './invoice-enums';

// Lo que responde GET /api/invoices y GET /api/invoices/{id} (InvoiceDTO de la API).
export interface Invoice {
  id: string;
  saleOrderId: string;
  invoiceNumber: string;
  headquarterId: string;
  clientID: string;
  petId: string;
  issueDate: string;
  total: number;
  paidAmount: number;
  balance: number;
  observations: string | null;
  state: InvoiceState;
}

// Query params de GET /api/invoices (InvoiceFilterRequestDTO). Las fechas van como yyyy-MM-dd.
export interface InvoiceFilters {
  headquarterId?: string | null;
  clientID?: string | null;
  petId?: string | null;
  saleOrderId?: string | null;
  invoiceNumber?: string | null;
  state?: InvoiceState | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

// Cuerpo de POST /api/invoices (CreateInvoiceRequestDTO).
export interface CreateInvoiceRequest {
  saleOrderId: string;
  observations: string | null;
}

// Cuerpo de PUT /api/invoices/{id}/payments (RegisterPaymentRequestDTO).
export interface RegisterPaymentRequest {
  amount: number;
}

// Respuesta 202 de las escrituras: la API publica en RabbitMQ y el procesador de pagos aplica el cambio.
export interface InvoiceAccepted {
  invoiceId: string;
  idMessage: string;
}
