import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <div class="progress-track">
        <div class="progress-fill" [style.width.%]="value"></div>
      </div>
      <span *ngIf="showLabel" class="progress-text">{{ value }}%</span>
    </div>
  `,
  styles: [`
    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .progress-text {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 32px;
      text-align: right;
    }
  `]
})
export class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() showLabel: boolean = true;
}
