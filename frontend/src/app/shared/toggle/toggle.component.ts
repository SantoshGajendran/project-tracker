import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toggle" [class.on]="value" (click)="toggle()">
      <div class="toggle-knob"></div>
    </div>
  `,
  styles: [`
    .toggle {
      width: 36px;
      height: 20px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-pill);
      position: relative;
      cursor: pointer;
      display: inline-block;
      vertical-align: middle;
      transition: background var(--duration-base), border-color var(--duration-base);
    }

    .toggle.on {
      background: var(--accent);
      border-color: var(--accent);
    }

    .toggle.on .toggle-knob {
      transform: translateX(16px);
    }

    .toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      transition: transform var(--duration-base) var(--ease-spring);
    }
  `]
})
export class ToggleComponent {
  @Input() value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  toggle(): void {
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }
}
