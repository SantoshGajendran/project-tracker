import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <header class="topbar">
      <div class="breadcrumb">
        @for (crumb of breadcrumbs; track $index; let last = $last) {
          <span [class.current]="last">{{ crumb === 'workspace' ? 'workspace' : (crumb | titlecase) }}</span>
          @if (!last) {
            <span class="sep">›</span>
          }
        }
      </div>

      <div class="cmd-trigger" (click)="openCommandPalette()" title="Search workspace (Ctrl+K)">
        <mat-icon class="cmd-search-icon">search</mat-icon>
        <span class="cmd-text">Search workspace...</span>
        <kbd class="kbd">Ctrl K</kbd>
      </div>

      <div class="actions">
        <button mat-icon-button (click)="toggleTheme()" title="Toggle Theme" class="action-btn">
          <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 52px;
      background: var(--topbar-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 90;
      flex-shrink: 0;
    }

    .breadcrumb {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: -0.2px;
    }

    .breadcrumb span {
      color: var(--text-secondary);
      transition: color var(--duration-base);
    }

    .breadcrumb span.current {
      color: var(--text-primary);
      font-weight: 500;
    }

    .breadcrumb .sep {
      color: var(--text-muted);
      font-size: 14px;
      user-select: none;
    }

    /* Command palette trigger */
    .cmd-trigger {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      width: 240px;
      transition: border-color var(--duration-fast), background var(--duration-fast), width var(--duration-base) var(--ease-out-expo);
    }

    .cmd-trigger:hover {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
      color: var(--text-secondary);
    }

    .cmd-search-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--text-muted);
    }

    .cmd-text {
      flex: 1;
      text-align: left;
      font-family: var(--font-body);
    }

    .kbd {
      font-family: var(--font-mono);
      font-size: 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: 4px;
      padding: 1px 5px;
      color: var(--text-muted);
      letter-spacing: -0.2px;
    }

    .actions {
      display: flex;
      align-items: center;
    }

    .action-btn {
      color: var(--text-muted) !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: color var(--duration-fast) !important;
    }

    .action-btn:hover {
      color: var(--text-primary) !important;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class TopbarComponent implements OnInit {
  router = inject(Router);
  breadcrumbs: string[] = ['workspace'];
  isDarkMode: boolean = true;

  ngOnInit(): void {
    // Default to light theme for light-first design
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme(savedTheme);

    // Initial breadcrumbs
    this.updateBreadcrumbs(this.router.url);

    // Track path changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: string): void {
    document.documentElement.setAttribute('theme', theme);
  }

  updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/').filter(p => p);
    this.breadcrumbs = ['workspace', ...parts.map(p => isNaN(Number(p)) ? p : `#${p}`)];
  }

  openCommandPalette(): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  }
}
