import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PermissionRow {
  feature: string;
  manager: boolean;
  lead: boolean;
  member: boolean;
  viewer: boolean;
}

@Component({
  selector: 'app-roles-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Roles & Permissions</h2>
        <p>View authorization privilege matrices across workspace roles</p>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Workspace Permission Matrix</h3>
          <p>This table defines operational limits for each workspace role. Permissions are system-enforced and read-only.</p>
        </div>

        <div class="matrix-table-wrapper">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Workspace Feature</th>
                <th class="text-center">Manager</th>
                <th class="text-center">Team Lead</th>
                <th class="text-center">Member</th>
                <th class="text-center">Viewer</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of matrix">
                <td>{{ p.feature }}</td>
                <td class="text-center">
                  <i class="ti ti-check check-icon" *ngIf="p.manager"></i>
                  <i class="ti ti-minus dash-icon" *ngIf="!p.manager"></i>
                </td>
                <td class="text-center">
                  <i class="ti ti-check check-icon" *ngIf="p.lead"></i>
                  <i class="ti ti-minus dash-icon" *ngIf="!p.lead"></i>
                </td>
                <td class="text-center">
                  <i class="ti ti-check check-icon" *ngIf="p.member"></i>
                  <i class="ti ti-minus dash-icon" *ngIf="!p.member"></i>
                </td>
                <td class="text-center">
                  <i class="ti ti-check check-icon" *ngIf="p.viewer"></i>
                  <i class="ti ti-minus dash-icon" *ngIf="!p.viewer"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-content {
      flex: 1;
      padding: 40px 56px;
      max-width: 760px;
    }

    .settings-section-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .settings-section-header h2 {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      font-style: italic;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .settings-section-header p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .card-header {
      margin-bottom: 20px;
    }

    .card-header h3 {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .card-header p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .matrix-table-wrapper {
      margin: 16px -24px 0;
      overflow-x: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .matrix-table th {
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 12px 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .matrix-table td {
      padding: 14px 24px;
      font-size: 13px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }

    .matrix-table tr:last-child td {
      border-bottom: none;
    }

    .text-center {
      text-align: center;
    }

    .check-icon {
      color: var(--status-active);
      font-size: 16px;
    }

    .dash-icon {
      color: var(--text-muted);
      font-size: 14px;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .matrix-table th, .matrix-table td {
        padding: 10px 12px;
      }
    }
  `]
})
export class RolesSettingsComponent {
  matrix: PermissionRow[] = [
    { feature: 'Create projects', manager: true, lead: true, member: false, viewer: false },
    { feature: 'Delete projects', manager: true, lead: false, member: false, viewer: false },
    { feature: 'Assign team members', manager: true, lead: true, member: false, viewer: false },
    { feature: 'Create tasks', manager: true, lead: true, member: true, viewer: false },
    { feature: 'Update any task', manager: true, lead: true, member: false, viewer: false },
    { feature: 'Update own tasks only', manager: true, lead: true, member: true, viewer: false },
    { feature: 'View all projects', manager: true, lead: true, member: true, viewer: true },
    { feature: 'SheetLoad import', manager: true, lead: true, member: false, viewer: false },
    { feature: 'Invite team members', manager: true, lead: false, member: false, viewer: false },
    { feature: 'Manage workspace settings', manager: true, lead: false, member: false, viewer: false },
    { feature: 'View analytics dashboard', manager: true, lead: true, member: true, viewer: false },
    { feature: 'Export reports', manager: true, lead: true, member: false, viewer: false }
  ];
}
