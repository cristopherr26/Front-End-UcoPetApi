import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'danger' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly state = signal<Toast[]>([]);
  readonly toasts = this.state.asReadonly();

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('danger', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  remove(id: number): void {
    this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, text: string): void {
    this.state.update((toasts) => [...toasts, { id: this.nextId++, kind, text }]);
  }
}
