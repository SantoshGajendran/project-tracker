import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToggleComponent } from '../../../shared/toggle/toggle.component';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleComponent],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Notification Settings</h2>
        <p>Configure how and where you receive updates and activity alerts</p>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Notification Preferences</h3>
          <p>Toggle in-app notification flags and email alerts for different workspace triggers.</p>
        </div>

        <div class="notif-table">
          <!-- Header row -->
          <div class="notif-header-row">
            <span class="col-event">Event Trigger</span>
            <span class="col-toggle">In-App</span>
            <span class="col-toggle">Email</span>
          </div>

          <!-- Rows — one per event type -->
          <div class="notif-row" *ngFor="let item of notifications">
            <div class="notif-info">
              <span class="notif-title">{{ item.title }}</span>
              <span class="notif-desc">{{ item.description }}</span>
            </div>
            <div class="toggle-cell">
              <app-toggle [(value)]="item.inApp" (valueChange)="onToggleChanged()"></app-toggle>
            </div>
            <div class="toggle-cell">
              <app-toggle [(value)]="item.email" (valueChange)="onToggleChanged()"></app-toggle>
            </div>
          </div>
        </div>

        <div class="card-actions border-top" style="margin-top: 24px;">
          <button class="btn-ghost" (click)="resetToDefaults()">Reset to Defaults</button>
          <button class="btn-primary" (click)="savePreferences()">Save Preferences</button>
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
      margin-bottom: 24px;
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

    .notif-table {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .notif-header-row {
      display: grid;
      grid-template-columns: 1fr 100px 100px;
      align-items: center;
      padding: 12px 20px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .col-event {
      text-align: left;
    }

    .col-toggle {
      text-align: center;
    }

    .notif-row {
      display: grid;
      grid-template-columns: 1fr 100px 100px;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
      transition: background var(--duration-fast);
    }

    .notif-row:last-child {
      border-bottom: none;
    }

    .notif-row:hover {
      background: rgba(255, 255, 255, 0.01);
    }

    .notif-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .notif-title {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .notif-desc {
      font-size: 12px;
      color: var(--text-muted);
    }

    .toggle-cell {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .card-actions.border-top {
      border-top: 1px solid var(--border-subtle);
      padding-top: 20px;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .notif-header-row, .notif-row {
        grid-template-columns: 1fr 70px 70px;
        padding: 10px 12px;
      }
    }
  `]
})
export class NotificationsSettingsComponent {
  snackBar = inject(MatSnackBar);

  notifications: NotificationSetting[] = [
    { id: '1', title: 'Task assigned to me', description: 'When a card has been assigned to your workspace profile.', inApp: true, email: true },
    { id: '2', title: 'Task status changed', description: 'When a card you are assigned to transitions state on the Kanban board.', inApp: true, email: false },
    { id: '3', title: 'Comment on my task', description: 'When another workspace contributor replies or comments on your task.', inApp: true, email: true },
    { id: '4', title: 'Sprint started/completed', description: 'When a sprint timeline is initialized or finalized by workspace operators.', inApp: true, email: false },
    { id: '5', title: 'Project at risk flagged', description: 'System health check notices if project delays exceed safe margins.', inApp: true, email: true },
    { id: '6', title: 'SheetLoad import complete', description: 'Ingestion task success or failure summary logs are available.', inApp: true, email: false },
    { id: '7', title: 'Weekly productivity digest', description: 'Sprint achievements and productivity scores summarized weekly.', inApp: false, email: true },
    { id: '8', title: 'Teammate joins workspace', description: 'When a new member registers or accepts invitation links.', inApp: true, email: false }
  ];

  onToggleChanged(): void {
    // optional logic
  }

  resetToDefaults(): void {
    this.notifications[0].inApp = true; this.notifications[0].email = true;
    this.notifications[1].inApp = true; this.notifications[1].email = false;
    this.notifications[2].inApp = true; this.notifications[2].email = true;
    this.notifications[3].inApp = true; this.notifications[3].email = false;
    this.notifications[4].inApp = true; this.notifications[4].email = true;
    this.notifications[5].inApp = true; this.notifications[5].email = false;
    this.notifications[6].inApp = false; this.notifications[6].email = true;
    this.notifications[7].inApp = true; this.notifications[7].email = false;
    this.snackBar.open('Notification defaults restored', 'Close', { duration: 3000 });
  }

  savePreferences(): void {
    this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
  }
}
