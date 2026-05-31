import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  danger?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile dropdown selection -->
    <div class="mobile-nav-container">
      <select class="input-field mobile-nav-select" [value]="activeRoute" (change)="onMobileNav($event)">
        <optgroup *ngFor="let g of groups()" [label]="g.label">
          <option *ngFor="let item of g.items" [value]="item.route">{{ item.label }}</option>
        </optgroup>
      </select>
    </div>

    <!-- Desktop sidebar nav -->
    <div class="settings-sidebar">
      <div class="settings-group" *ngFor="let g of groups()">
        <div class="settings-group-label">{{ g.label }}</div>
        <a 
          *ngFor="let item of g.items" 
          [routerLink]="item.route"
          routerLinkActive="active"
          class="settings-nav-item"
          [class.danger]="item.danger"
        >
          <i class="ti nav-icon" [ngClass]="item.icon"></i>
          {{ item.label }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .mobile-nav-container {
      display: none;
      padding: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .mobile-nav-select {
      width: 100%;
      background: var(--bg-surface);
      color: var(--text-primary);
      padding: 10px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-default);
    }

    .settings-sidebar {
      width: 220px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-subtle);
      padding: 32px 0;
      position: sticky;
      top: 52px; /* below topbar */
      height: calc(100vh - 52px);
      overflow-y: auto;
      background: var(--bg-void);
    }

    .settings-group {
      margin-bottom: 24px;
    }

    .settings-group-label {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 0 20px 8px;
    }

    .settings-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 20px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      position: relative;
      transition: color var(--duration-fast), background var(--duration-fast);
    }

    .settings-nav-item.active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }

    .settings-nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 2px;
      background: var(--accent);
      border-radius: 0 2px 2px 0;
    }

    .settings-nav-item:hover:not(.active) {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.02);
    }

    .nav-icon {
      font-size: 15px;
      color: inherit;
    }

    .settings-nav-item.danger {
      color: var(--status-danger);
    }

    .settings-nav-item.danger:hover {
      background: rgba(252, 129, 129, 0.06);
    }

    @media (max-width: 767px) {
      .mobile-nav-container {
        display: block;
      }
      .settings-sidebar {
        display: none;
      }
    }
  `]
})
export class SettingsSidebarComponent implements OnInit {
  router = inject(Router);
  authService = inject(AuthService);
  activeRoute = '/settings/profile';

  groups = computed<NavGroup[]>(() => {
    const user = this.authService.currentUser();
    const hasWorkspaceAccess = user && (user.role === 'MANAGER' || user.role === 'TEAM_LEAD');
    
    return [
      {
        label: 'Account',
        items: [
          { label: 'Profile', route: '/settings/profile', icon: 'ti-user' },
          { label: 'Security', route: '/settings/security', icon: 'ti-shield-lock' },
          { label: 'Notifications', route: '/settings/notifications', icon: 'ti-bell' },
          { label: 'Appearance', route: '/settings/appearance', icon: 'ti-palette' }
        ]
      },
      ...(hasWorkspaceAccess ? [
        {
          label: 'Workspace',
          items: [
            { label: 'General', route: '/settings/general', icon: 'ti-settings' },
            { label: 'Team Members', route: '/settings/team', icon: 'ti-users' },
            { label: 'Roles & Permissions', route: '/settings/roles', icon: 'ti-lock-access' },
            { label: 'Project Categories', route: '/settings/categories', icon: 'ti-tag' },
            { label: 'SheetLoad Access', route: '/settings/sheetload', icon: 'ti-table-import' }
          ]
        },
        {
          label: 'Danger',
          items: [
            { label: 'Danger Zone', route: '/settings/danger', icon: 'ti-alert-triangle', danger: true }
          ]
        }
      ] : [])
    ];
  });

  ngOnInit(): void {
    this.activeRoute = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = event.urlAfterRedirects;
    });
  }

  onMobileNav(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.router.navigate([target.value]);
  }
}
