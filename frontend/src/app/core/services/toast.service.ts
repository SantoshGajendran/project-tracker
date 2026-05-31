import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000): void {
    const id = this.nextId++;
    const newToast: Toast = { id, message, type, duration };
    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
