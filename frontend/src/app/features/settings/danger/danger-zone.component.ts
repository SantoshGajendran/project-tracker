import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-danger-zone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Danger Zone</h2>
        <p>Destructive workspace operations, transfers, exports, and permanent deletion controls</p>
      </div>

      <div class="danger-zone">
        <!-- Item 1: Transfer -->
        <div class="danger-item">
          <div class="danger-meta">
            <p class="danger-title">Transfer Workspace Ownership</p>
            <p class="danger-desc">Transfer full control of this workspace to another Manager.</p>
          </div>
          <button class="btn-danger" (click)="transferOwnership()">Transfer Ownership</button>
        </div>

        <!-- Item 2: Export -->
        <div class="danger-item">
          <div class="danger-meta">
            <p class="danger-title">Export All Data</p>
            <p class="danger-desc">Download a full export of all projects, tasks, and activity logs as JSON.</p>
          </div>
          <button class="btn-ghost" (click)="exportWorkspaceData()">
            <i class="ti ti-download"></i> Export (.json)
          </button>
        </div>

        <!-- Item 3: Delete -->
        <div class="danger-item severe">
          <div class="danger-meta">
            <p class="danger-title">Delete Workspace</p>
            <p class="danger-desc">Permanently delete this workspace and all its data. This cannot be undone.</p>
          </div>
          <button class="btn-danger" (click)="confirmDeleteWorkspace()">
            <i class="ti ti-trash"></i> Delete Workspace
          </button>
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

    .danger-zone {
      border: 1px solid rgba(252, 129, 129, 0.2);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--bg-surface);
    }

    .danger-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      gap: 24px;
      border-bottom: 1px solid rgba(252, 129, 129, 0.1);
      transition: background var(--duration-fast);
    }

    .danger-item:last-child {
      border-bottom: none;
    }

    .danger-item:hover {
      background: rgba(255,255,255,0.005);
    }

    .danger-item.severe {
      background: rgba(252, 129, 129, 0.02);
    }
    .danger-item.severe:hover {
      background: rgba(252, 129, 129, 0.04);
    }

    .danger-meta {
      flex: 1;
    }

    .danger-title {
      font-size: 14.5px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .danger-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }

    .btn-danger {
      background: var(--status-danger) !important;
      color: #ffffff !important;
      border: none;
      border-radius: var(--radius-md);
      padding: 8px 16px;
      font-size: 13px;
      font-family: var(--font-body);
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform var(--duration-fast) var(--ease-spring), opacity var(--duration-fast);
    }

    .btn-danger:hover {
      opacity: 0.95;
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(252, 129, 129, 0.2);
    }

    .btn-danger:active {
      transform: scale(0.97);
    }

    .btn-ghost {
      border-color: var(--border-default) !important;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .danger-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .btn-danger, .btn-ghost {
        align-self: flex-end;
      }
    }
  `]
})
export class DangerZoneComponent {
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  http = inject(HttpClient);

  transferOwnership(): void {
    const targetEmail = prompt('Enter the email address of the manager to transfer ownership to:');
    if (targetEmail && targetEmail.trim()) {
      this.snackBar.open(`Ownership transfer initialized to ${targetEmail.trim()}`, 'Close', { duration: 3000 });
    }
  }

  exportWorkspaceData(): void {
    this.snackBar.open('Generating workspace export JSON...', 'Close', { duration: 2000 });
    
    // Call endpoint or simulate file download
    setTimeout(() => {
      const mockData = {
        workspace: 'Project Tracker',
        exportedAt: new Date().toISOString(),
        projects: [],
        tasks: []
      };

      const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workspace-export.json';
      link.click();
      window.URL.revokeObjectURL(url);
      this.snackBar.open('Workspace data exported successfully', 'Close', { duration: 3000 });
    }, 1500);
  }

  confirmDeleteWorkspace(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Workspace',
        message: 'WARNING: This will permanently delete the entire workspace, including all projects, sprints, tasks, and member profiles. This action is irreversible.',
        confirmText: 'Delete Workspace',
        cancelText: 'Cancel',
        type: 'danger',
        requireTypedConfirmation: true,
        expectedConfirmationText: 'DELETE'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.snackBar.open('Workspace deletion initiated. Goodbye.', 'Close', { duration: 5000 });
      }
    });
  }
}
