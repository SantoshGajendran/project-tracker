import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToggleComponent } from '../../../shared/toggle/toggle.component';

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToggleComponent],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Security Settings</h2>
        <p>Manage your password, two-factor authentication, and active sessions</p>
      </div>

      <!-- Card 1: Change Password -->
      <div class="settings-card">
        <div class="card-header">
          <h3>Change Password</h3>
          <p>Ensure your account is using a long, random password to stay secure.</p>
        </div>
        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="settings-form">
          <div class="form-group-custom">
            <label class="form-label-custom">Current Password</label>
            <input type="password" formControlName="currentPassword" class="input-field" placeholder="••••••••" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group-custom">
              <label class="form-label-custom">New Password</label>
              <input type="password" formControlName="newPassword" class="input-field" placeholder="••••••••" (input)="checkStrength()" required />
              <div class="strength-bar">
                <div class="strength-fill" [ngClass]="strength" [style.width.%]="strengthWidth"></div>
              </div>
              <span class="strength-label mono uppercase" *ngIf="passwordForm.get('newPassword')?.value">Strength: {{ strength }}</span>
            </div>

            <div class="form-group-custom">
              <label class="form-label-custom">Confirm New Password</label>
              <input type="password" formControlName="confirmPassword" class="input-field" placeholder="••••••••" required />
              <span class="error-msg" *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched">Passwords do not match</span>
            </div>
          </div>

          <div class="card-actions">
            <button type="submit" class="btn-primary" [disabled]="passwordForm.invalid || submitting">
              Update Password
            </button>
          </div>
        </form>
      </div>

      <!-- Card 2: Two-Factor Authentication -->
      <div class="settings-card">
        <div class="card-header border-bottom">
          <div class="header-row">
            <div>
              <h3>Two-Factor Authentication</h3>
              <p>Add an extra layer of security to your account by requiring a verification code.</p>
            </div>
            <div class="badge-toggle-group">
              <span class="badge" [ngClass]="twoFactorEnabled ? 'active' : 'muted'">
                {{ twoFactorEnabled ? 'Enabled' : 'Not configured' }}
              </span>
              <app-toggle [(value)]="twoFactorEnabled"></app-toggle>
            </div>
          </div>
        </div>

        <div class="card-body-expand" *ngIf="twoFactorEnabled">
          <div class="tfa-setup-row">
            <div class="qr-code-placeholder">
              <i class="ti ti-qrcode"></i>
              <span>Scan QR Code</span>
            </div>
            <div class="tfa-setup-details">
              <h4>Scan the QR code in your authenticator app</h4>
              <p>Use Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code to register your device.</p>
              <div class="backup-codes-panel">
                <h5>Backup Recovery Codes</h5>
                <p>Save these recovery codes in a secure place. If you lose your device, they are the only way to recover access.</p>
                <div class="backup-codes mono">
                  <code>PT-8A2F-9B1D</code>
                  <code>PT-4D7C-0E6B</code>
                  <code>PT-5K2L-7P9Q</code>
                  <code>PT-1X9W-3Z8V</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Active Sessions -->
      <div class="settings-card">
        <div class="card-header">
          <h3>Active Sessions</h3>
          <p>These devices are currently logged into your account. Revoke any sessions you do not recognize.</p>
        </div>

        <div class="sessions-table-wrapper">
          <table class="sessions-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Browser</th>
                <th>Location</th>
                <th>Last Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sessions" [class.current-session]="s.current">
                <td>
                  <div class="device-cell">
                    <i class="ti" [ngClass]="s.device === 'Mobile' ? 'ti-device-mobile' : 'ti-device-laptop'"></i>
                    <span>{{ s.device }}</span>
                    <span class="badge active you-badge" *ngIf="s.current">this device</span>
                  </div>
                </td>
                <td class="mono">{{ s.browser }}</td>
                <td>{{ s.location }}</td>
                <td class="mono muted">{{ s.lastActive }}</td>
                <td>
                  <button class="icon-btn danger" *ngIf="!s.current" (click)="revokeSession(s)" title="Revoke Session">
                    <i class="ti ti-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card-actions border-top" style="justify-content: flex-start; margin-top: 16px;">
          <button class="btn-ghost danger" (click)="revokeAllOthers()">
            Revoke All Other Sessions
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

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 24px;
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

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group-custom {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label-custom {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .strength-bar {
      height: 3px;
      background: var(--border-subtle);
      border-radius: var(--radius-pill);
      margin-top: 6px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: var(--radius-pill);
      transition: width 300ms var(--ease-out-expo), background 300ms;
    }

    .strength-fill.weak { width: 25%; background: var(--status-danger); }
    .strength-fill.fair { width: 60%; background: var(--status-warning); }
    .strength-fill.strong { width: 100%; background: var(--status-active); }

    .strength-label {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .error-msg {
      font-size: 11px;
      color: var(--status-danger);
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
    }

    .card-actions.border-top {
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
    }

    /* TFA expansion details */
    .tfa-setup-row {
      display: flex;
      gap: 24px;
      padding-top: 8px;
    }

    .qr-code-placeholder {
      width: 120px;
      height: 120px;
      background: #ffffff;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      color: #080a0f;
    }

    .qr-code-placeholder i {
      font-size: 32px;
    }

    .qr-code-placeholder span {
      font-size: 10px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      font-weight: 500;
    }

    .tfa-setup-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tfa-setup-details h4 {
      font-size: 14px;
      font-weight: 500;
      margin: 0;
    }

    .tfa-setup-details p {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
    }

    .backup-codes-panel {
      background: var(--bg-void);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-top: 8px;
    }

    .backup-codes-panel h5 {
      font-size: 12px;
      font-weight: 500;
      margin: 0 0 4px;
    }

    .backup-codes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 12px;
    }

    .backup-codes code {
      font-size: 12px;
      color: var(--accent);
      background: rgba(99, 179, 237, 0.05);
      border: 1px solid var(--border-accent);
      border-radius: var(--radius-sm);
      padding: 6px;
      text-align: center;
    }

    /* Sessions Table */
    .sessions-table-wrapper {
      margin: 16px -24px 0;
      overflow-x: auto;
    }

    .sessions-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .sessions-table th {
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 12px 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sessions-table td {
      padding: 14px 24px;
      font-size: 13px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sessions-table tr:last-child td {
      border-bottom: none;
    }

    .sessions-table tr.current-session {
      background: rgba(255,255,255,0.01);
    }

    .device-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .device-cell i {
      font-size: 16px;
      color: var(--text-secondary);
    }

    .you-badge {
      font-size: 9px;
      padding: 1px 4px;
    }

    .icon-btn.danger {
      background: transparent;
      border: none;
      color: var(--status-danger);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      transition: background var(--duration-fast);
    }

    .icon-btn.danger:hover {
      background: rgba(252, 129, 129, 0.1);
    }

    .btn-ghost.danger {
      color: var(--status-danger) !important;
      border-color: rgba(252, 129, 129, 0.2) !important;
    }

    .btn-ghost.danger:hover {
      background: rgba(252, 129, 129, 0.05) !important;
      border-color: var(--status-danger) !important;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .tfa-setup-row {
        flex-direction: column;
        align-items: center;
      }
      .backup-codes {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SecuritySettingsComponent implements OnInit {
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);

  passwordForm!: FormGroup;
  submitting = false;
  twoFactorEnabled = false;

  strength: 'weak' | 'fair' | 'strong' = 'weak';
  strengthWidth = 0;

  sessions: ActiveSession[] = [
    { id: '1', device: 'Desktop', browser: 'Chrome / Windows', location: 'Bengaluru, India', lastActive: 'Active now', current: true },
    { id: '2', device: 'Mobile', browser: 'Safari / iPhone', location: 'Bengaluru, India', lastActive: '2 hours ago', current: false },
    { id: '3', device: 'Desktop', browser: 'Firefox / macOS', location: 'Mumbai, India', lastActive: '3 days ago', current: false }
  ];

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  checkStrength(): void {
    const val = this.passwordForm.get('newPassword')?.value || '';
    if (!val) {
      this.strengthWidth = 0;
      this.strength = 'weak';
      return;
    }

    let points = 0;
    if (val.length >= 8) points++;
    if (/[A-Z]/.test(val)) points++;
    if (/[0-9]/.test(val)) points++;
    if (/[^A-Za-z0-9]/.test(val)) points++;

    if (points <= 2) {
      this.strength = 'weak';
      this.strengthWidth = 25;
    } else if (points === 3) {
      this.strength = 'fair';
      this.strengthWidth = 60;
    } else {
      this.strength = 'strong';
      this.strengthWidth = 100;
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;
    this.submitting = true;
    setTimeout(() => {
      this.submitting = false;
      this.snackBar.open('Password updated successfully', 'Close', { duration: 3000 });
      this.passwordForm.reset();
      this.strengthWidth = 0;
    }, 1500);
  }

  revokeSession(session: ActiveSession): void {
    this.sessions = this.sessions.filter(s => s.id !== session.id);
    this.snackBar.open(`Session on ${session.device} revoked`, 'Close', { duration: 3000 });
  }

  revokeAllOthers(): void {
    this.sessions = this.sessions.filter(s => s.current);
    this.snackBar.open('All other active sessions revoked', 'Close', { duration: 3000 });
  }
}
