import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      <span class="dot"></span>
      {{ getDisplayLabel() }}
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class BadgeComponent {
  @Input() label: string = '';
  @Input() type: 'priority' | 'status' | 'task-status' | 'sprint-status' = 'status';

  getBadgeClass(): string {
    if (!this.label) return '';
    
    // Map existing statuses to classes in design-tokens
    const val = this.label.toUpperCase();
    if (val === 'COMPLETED' || val === 'DONE') return 'done';
    if (val === 'IN_PROGRESS' || val === 'IN_REVIEW' || val === 'ACTIVE') return 'active';
    if (val === 'ON_HOLD' || val === 'WARNING') return 'warning';
    if (val === 'CANCELLED' || val === 'LOW') return 'done';
    if (val === 'HIGH' || val === 'CRITICAL' || val === 'DANGER') return 'danger';
    if (val === 'PLANNING' || val === 'PLANNED' || val === 'TODO') return 'planning';
    if (val === 'MEDIUM') return 'warning';
    
    return val.toLowerCase();
  }

  getDisplayLabel(): string {
    if (!this.label) return '';
    return this.label.replace('_', ' ');
  }
}
