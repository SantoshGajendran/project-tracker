import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h4 class="empty-heading">{{ title }}</h4>
      <p class="empty-sub">{{ description }}</p>
      <button *ngIf="actionLabel" class="btn-primary" (click)="onActionClick()" style="margin-top: 4px;">
        <mat-icon *ngIf="actionIcon" style="font-size: 16px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">{{ actionIcon }}</mat-icon>
        <span>{{ actionLabel }}</span>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .empty-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No data found';
  @Input() description: string = 'There is currently no information available in this section.';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;

  @Output() action = new EventEmitter<void>();

  onActionClick(): void {
    this.action.emit();
  }
}
