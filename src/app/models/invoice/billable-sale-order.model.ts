// Solo los campos de una orden de venta (GET /api/v1/sales) que necesita Facturas para elegir qué facturar.
// El modelo completo de la orden es del módulo de Ventas; aquí no se duplica.
export interface BillableSaleOrder {
  id: string;
  orderNumber: string;
  headquarterId: string;
  clientID: string;
  petId: string;
  saleDate: string;
  total: number;
  state: string;
}
