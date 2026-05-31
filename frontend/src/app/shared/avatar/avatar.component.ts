import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [ngClass]="'avatar ' + size" 
      [ngStyle]="{'background-color': getBgColor()}"
      [title]="name">
      <span>{{ getInitials() }}</span>
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-weight: 500;
      border: 1.5px solid var(--bg-base);
      flex-shrink: 0;
      color: #FFFFFF;
      overflow: hidden;
      user-select: none;
    }
    .sm { width: 24px; height: 24px; font-size: 9px; }
    .md { width: 32px; height: 32px; font-size: 12px; }
    .lg { width: 40px; height: 40px; font-size: 14px; }
    .xl { width: 52px; height: 52px; font-size: 18px; }
  `]
})
export class AvatarComponent {
  @Input() name: string = '';
  @Input() src?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  imgFailed: boolean = false;

  getInitials(): string {
    if (!this.name) return '';
    const parts = this.name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.name[0].toUpperCase();
  }

  getBgColor(): string {
    if (!this.name) return '#999';
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'];
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  onImgError(): void {
    this.imgFailed = true;
  }
}
