import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  AuthorizeOrderRequest,
  ChangeProcedureRequest,
  CreateOrderRequest,
  Order,
} from '../../models/order/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  private readonly url = `${environment.apiUrl}/orders`;

  // Listados
  list(): Observable<Order[]> {
    return this.http.get<Order[]>(this.url);
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${id}`);
  }

  // Escritura (el backend guarda, publica en RabbitMQ y responde con la orden)
  create(request: CreateOrderRequest): Observable<Order> {
    // Se arma el cuerpo campo a campo para no enviar nunca id, state, date ni isAuthorized
    const body: CreateOrderRequest = {
      tutorId: request.tutorId,
      petId: request.petId,
      procedureId: request.procedureId,
    };
    return this.http.post<Order>(this.url, body);
  }

  changeProcedure(id: string, procedureId: string): Observable<Order> {
    const body: ChangeProcedureRequest = { procedureId };
    return this.http.patch<Order>(`${this.url}/${id}/procedure`, body);
  }

  authorize(id: string, isAuthorized: boolean): Observable<Order> {
    const body: AuthorizeOrderRequest = { isAuthorized };
    return this.http.patch<Order>(`${this.url}/${id}/authorize`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
