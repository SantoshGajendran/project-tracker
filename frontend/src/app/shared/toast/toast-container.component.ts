import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [ngClass]="toast.type" [style.--toast-duration]="toast.duration + 'ms'">
          <div class="toast-icon">
            <mat-icon>{{ getIcon(toast.type) }}</mat-icon>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">&times;</button>
          <div class="toast-timer"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.02);
      font-size: 13px;
      color: var(--text-primary);
      min-width: 290px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideLeft 250ms var(--ease-spring) both;
      overflow: hidden;
    }
    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .toast-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .toast.success .toast-icon { color: var(--status-active); }
    .toast.error .toast-icon { color: var(--status-danger); }
    .toast.info .toast-icon { color: var(--accent); }
    
    .toast-message {
      flex: 1;
      font-family: var(--font-body);
      font-weight: 400;
      line-height: 1.4;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color var(--duration-fast);
    }
    .toast-close:hover {
      color: var(--text-primary);
    }
    .toast-timer {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: currentColor;
      opacity: 0.25;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      animation: shrink var(--toast-duration, 4000ms) linear forwards;
    }
    @keyframes slideLeft {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle_outline';
      case 'error': return 'error_outline';
      case 'info':
      default:
        return 'info_outline';
    }
  }
}
