import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ToggleComponent } from '../../../shared/toggle/toggle.component';

@Component({
  selector: 'app-sheetload-access',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleComponent],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>SheetLoad Integration</h2>
        <p>Manage Excel/CSV ingestion access gates and permission restrictions</p>
      </div>

      <div class="settings-card">
        <div class="card-header border-bottom">
          <div class="header-row">
            <div>
              <h3>SheetLoad Bulk Import Ingestion</h3>
              <p>When active, workspace administrators can bulk import sprint/task details via Excel sheets.</p>
            </div>
            <div class="badge-toggle-group" *ngIf="authService.isManager()">
              <span class="badge" [ngClass]="sheetloadActive ? 'active' : 'muted'">
                {{ sheetloadActive ? 'Active' : 'Disabled' }}
              </span>
              <app-toggle [(value)]="sheetloadActive" (valueChange)="onToggleChanged()"></app-toggle>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="role-restriction-notice" *ngIf="!authService.isManager()">
            <i class="ti ti-lock-access lock-icon"></i>
            <div>
              <h4>Access Gate Restricted</h4>
              <p>Workspace Settings for SheetLoad integration require **Manager** permission. Your current account role restricts adjustments to this integration gate.</p>
            </div>
          </div>

          <div class="integration-details" *ngIf="authService.isManager()">
            <div class="feature-checklist">
              <div class="feature-item">
                <i class="ti ti-check check-icon"></i>
                <div>
                  <h5>Dynamic Schema Mapping</h5>
                  <p>Inbound CSV sheets automatically align sprint, assignee, status, and points fields.</p>
                </div>
              </div>
              <div class="feature-item">
                <i class="ti ti-check check-icon"></i>
                <div>
                  <h5>Import Log Auditing</h5>
                  <p>All sheetload executions append logs indicating records inserted, updated or skipped.</p>
                </div>
              </div>
            </div>
          </div>
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

    .card-header.border-bottom {
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
      margin-bottom: 16px;
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

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .badge-toggle-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      border: 1px solid var(--border-default);
    }

    .badge.active {
      background: var(--accent-glow);
      color: var(--accent);
      border-color: var(--border-accent);
    }

    .badge.muted {
      background: var(--bg-elevated);
      color: var(--text-muted);
    }

    .role-restriction-notice {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: rgba(252, 129, 129, 0.03);
      border: 1px solid rgba(252, 129, 129, 0.15);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
    }

    .lock-icon {
      font-size: 24px;
      color: var(--status-danger);
    }

    .role-restriction-notice h4 {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .role-restriction-notice p {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }

    .integration-details {
      margin-top: 16px;
    }

    .feature-checklist {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .check-icon {
      color: var(--status-active);
      font-size: 16px;
      margin-top: 2px;
    }

    .feature-item h5 {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 2px;
    }

    .feature-item p {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .header-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .badge-toggle-group {
        align-self: flex-end;
      }
    }
  `]
})
export class SheetloadAccessComponent implements OnInit {
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);

  sheetloadActive = true;

  ngOnInit(): void {
    const saved = localStorage.getItem('sheetload-active');
    if (saved !== null) {
      this.sheetloadActive = saved === 'true';
    }
  }

  onToggleChanged(): void {
    localStorage.setItem('sheetload-active', this.sheetloadActive.toString());
    this.snackBar.open(
      `SheetLoad ingestion integration ${this.sheetloadActive ? 'enabled' : 'disabled'}`, 
      'Close', 
      { duration: 3000 }
    );
  }
}
