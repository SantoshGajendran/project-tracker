import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-container">
      <div class="confirm-header">
        <div class="icon-box" [ngClass]="data.type || 'danger'">
          <mat-icon>{{ getIcon() }}</mat-icon>
        </div>
        <h2 class="confirm-title">{{ data.title }}</h2>
      </div>
      
      <div class="confirm-body">
        <p>{{ data.message }}</p>
      </div>
      
      <div class="confirm-actions">
        <button class="btn-secondary" (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button class="btn-primary-action" [ngClass]="data.type || 'danger'" (click)="onConfirm()">{{ data.confirmText || 'Confirm' }}</button>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      padding: 0 !important;
      border-radius: var(--radius-xl) !important;
      overflow: hidden !important;
    }

    .confirm-container {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
    }
    
    .confirm-header {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .icon-box.danger {
      background: rgba(220, 38, 38, 0.1);
      color: var(--status-danger);
    }
    .icon-box.warning {
      background: rgba(217, 119, 6, 0.1);
      color: var(--status-warning);
    }
    .icon-box.info {
      background: rgba(37, 99, 235, 0.1);
      color: var(--accent);
    }
    
    .icon-box mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .confirm-title {
      margin: 0;
      font-family: var(--font-body);
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .confirm-body p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 13.5px;
      line-height: 1.5;
    }
    
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
    
    button {
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      cursor: pointer;
      border: none;
      transition: all var(--duration-fast) var(--ease-in-out);
    }
    
    .btn-secondary {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
    }
    
    .btn-secondary:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border-color: var(--border-strong);
    }
    
    .btn-primary-action {
      color: #ffffff;
    }
    
    .btn-primary-action.danger {
      background: var(--status-danger);
    }
    .btn-primary-action.danger:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }
    
    .btn-primary-action.warning {
      background: var(--status-warning);
    }
    .btn-primary-action.warning:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
    }
    
    .btn-primary-action.info {
      background: var(--accent);
    }
    .btn-primary-action.info:hover {
      opacity: 0.9;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  getIcon(): string {
    if (this.data.type === 'warning') return 'warning';
    if (this.data.type === 'info') return 'info';
    return 'report_problem';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
