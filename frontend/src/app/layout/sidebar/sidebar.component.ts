import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="sidebar">
      <div class="brand-section">
        <div class="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="6" height="6" rx="1.5" fill="currentColor"/>
            <rect x="14" y="4" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
            <rect x="4" y="14" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
            <rect x="14" y="14" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <nav class="nav-list">
        <a 
          *ngFor="let item of navItems" 
          [routerLink]="item.route" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{exact: item.route === '/'}"
          class="nav-item"
          [title]="item.label">
          <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <mat-divider class="divider"></mat-divider>
        <div class="user-info" *ngIf="authService.currentUser() as user">
          <div class="avatar-fallback">{{ user.name[0] }}</div>
          <div class="meta">
            <span class="name">{{ user.name }}</span>
            <span class="role">{{ user.role | titlecase }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="onLogout()" title="Sign Out">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 64px;
      height: 100vh;
      background: var(--bg-void);
      border-right: 1px solid var(--border-subtle);
      transition: width var(--duration-slow) var(--ease-out-expo);
      display: flex;
      flex-direction: column;
      padding: 20px 0;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      overflow: hidden;
    }
    
    .sidebar:hover {
      width: 220px;
    }

    .brand-section {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .logo-mark {
      width: 32px;
      height: 32px;
      background: var(--accent);
      color: var(--bg-void);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      box-shadow: 0 0 0 0 var(--accent-glow);
      transition: box-shadow var(--duration-base) var(--ease-in-out);
      cursor: pointer;
    }
    
    .logo-mark svg {
      width: 100%;
      height: 100%;
    }

    .sidebar:hover .logo-mark {
      box-shadow: 0 0 20px 4px var(--accent-glow);
    }

    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 22px;
      gap: 16px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: color var(--duration-base), background-color var(--duration-base);
    }

    /* Active left-border accent bar */
    .nav-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 2px;
      background: var(--accent);
      border-radius: 0 2px 2px 0;
      opacity: 0;
      transform: scaleY(0);
      transition: opacity var(--duration-base), transform var(--duration-base) var(--ease-spring);
    }

    .nav-item.active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }
    
    .nav-item.active::before {
      opacity: 1;
      transform: scaleY(1);
    }

    .nav-item:hover:not(.active) {
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.02);
    }

    .nav-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      opacity: 0;
      transform: translateX(-6px);
      transition: opacity var(--duration-base), transform var(--duration-base) var(--ease-out-expo);
      font-family: var(--font-body);
    }

    .sidebar:hover .nav-label {
      opacity: 1;
      transform: translateX(0);
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 12px;
      flex-shrink: 0;
    }

    .divider {
      background-color: var(--border-subtle) !important;
      margin-bottom: 4px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 10px;
    }

    .avatar-fallback {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
    }

    .meta {
      display: flex;
      flex-direction: column;
      opacity: 0;
      width: 0;
      overflow: hidden;
      transition: opacity var(--duration-base) var(--ease-out-expo), width var(--duration-base) var(--ease-out-expo);
    }

    .sidebar:hover .meta {
      opacity: 1;
      width: auto;
    }

    .meta .name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .meta .role {
      font-size: 10px;
      color: var(--text-muted);
    }

    .logout-btn {
      width: 100%;
      height: 40px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      gap: 16px;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: var(--radius-md);
      padding: 0 10px;
      transition: color var(--duration-fast), background-color var(--duration-fast);
    }

    .logout-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .logout-btn span {
      font-family: var(--font-body);
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      width: 0;
      overflow: hidden;
      transition: opacity var(--duration-base) var(--ease-out-expo), width var(--duration-base) var(--ease-out-expo);
    }

    .sidebar:hover .logout-btn span {
      opacity: 1;
      width: auto;
    }

    .logout-btn:hover {
      background-color: rgba(252, 129, 129, 0.08);
      color: var(--status-danger);
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  navItems: NavItem[] = [
    { icon: 'grid_view', label: 'Dashboard', route: '/' },
    { icon: 'folder', label: 'Projects', route: '/projects' },
    { icon: 'playlist_add_check', label: 'Tasks', route: '/tasks' },
    { icon: 'group', label: 'Team', route: '/team' },
    { icon: 'timeline', label: 'Sprints', route: '/sprints' },
    { icon: 'cloud_upload', label: 'SheetLoad', route: '/import' },
    { icon: 'settings', label: 'Settings', route: '/settings' }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}

