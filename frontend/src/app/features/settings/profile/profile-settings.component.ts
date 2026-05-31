import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AvatarComponent],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Personal Profile</h2>
        <p>Update your display name, avatar, and workspace information</p>
      </div>

      <!-- Profile Header Banner -->
      <div class="profile-banner">
        <div class="banner-content">
          <div class="avatar-wrapper">
            <div class="avatar-ring-large" (click)="triggerAvatarUpload()" title="Click to upload avatar">
              <app-avatar [name]="profileForm.get('name')?.value || authService.currentUser()?.name || ''" 
                          [src]="authService.currentUser()?.avatar || ''" 
                          size="xl"></app-avatar>
              <div class="avatar-overlay-cam">
                <i class="ti ti-camera"></i>
                <span>Change</span>
              </div>
            </div>
            <input type="file" id="avatarFileInput" style="display: none;" (change)="onAvatarFileSelected($event)" accept="image/*">
          </div>
          <div class="banner-text">
            <div class="name-badge-row">
              <h3 class="banner-user-name">{{ profileForm.get('name')?.value || 'Your Name' }}</h3>
              <span class="role-badge">{{ authService.currentUser()?.role || 'Teammate' }}</span>
            </div>
            <p class="banner-user-handle">&#64;{{ profileForm.get('displayName')?.value || 'username' }}</p>
            <p class="banner-user-sub">{{ profileForm.get('jobTitle')?.value || 'No Job Title' }} &bull; {{ profileForm.get('department')?.value || 'No Department' }}</p>
          </div>
        </div>
      </div>

      <div class="profile-layout-grid">
        <!-- Input Form Side -->
        <div class="form-side">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="settings-form">
            
            <!-- Card 1: Identity & Contact -->
            <div class="form-card animate-fade-in">
              <div class="card-header-custom">
                <i class="ti ti-user-circle"></i>
                <h4>Identity & Contact</h4>
              </div>
              <div class="card-body-custom">
                <div class="form-grid-2">
                  <div class="form-group-custom">
                    <label class="form-label-custom">Full Name*</label>
                    <input type="text" formControlName="name" class="input-field" placeholder="Full Name" required />
                    <span class="error-msg" *ngIf="profileForm.get('name')?.invalid && profileForm.get('name')?.touched">Name is required</span>
                  </div>

                  <div class="form-group-custom">
                    <label class="form-label-custom">Display Name / Handle</label>
                    <input type="text" formControlName="displayName" class="input-field" placeholder="e.g. santosh" />
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group-custom">
                    <label class="form-label-custom">Email Address*</label>
                    <input type="email" formControlName="email" class="input-field disabled-field" placeholder="Email Address" />
                    <span class="hint-text">Email cannot be changed</span>
                  </div>

                  <div class="form-group-custom">
                    <label class="form-label-custom">Phone (optional)</label>
                    <input type="text" formControlName="phone" class="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Professional Details -->
            <div class="form-card animate-fade-in" style="animation-delay: 100ms;">
              <div class="card-header-custom">
                <i class="ti ti-briefcase"></i>
                <h4>Professional Details</h4>
              </div>
              <div class="card-body-custom">
                <div class="form-grid-2">
                  <div class="form-group-custom">
                    <label class="form-label-custom">Job Title</label>
                    <input type="text" formControlName="jobTitle" class="input-field" placeholder="e.g. Senior Developer" />
                  </div>

                  <div class="form-group-custom">
                    <label class="form-label-custom">Department</label>
                    <input type="text" formControlName="department" class="input-field" placeholder="e.g. Engineering" />
                  </div>
                </div>

                <div class="form-group-custom">
                  <label class="form-label-custom">Bio</label>
                  <textarea formControlName="bio" class="input-field textarea-field" placeholder="Tell us about yourself..." rows="3"></textarea>
                </div>

                <div class="form-grid-2">
                  <div class="form-group-custom">
                    <label class="form-label-custom">Timezone</label>
                    <select formControlName="timezone" class="input-field select-field">
                      <option value="UTC">UTC (GMT+00:00)</option>
                      <option value="IST">IST (GMT+05:30)</option>
                      <option value="EST">EST (GMT-05:00)</option>
                      <option value="PST">PST (GMT-08:00)</option>
                      <option value="GMT">GMT (GMT+01:00)</option>
                    </select>
                  </div>

                  <div class="form-group-custom">
                    <label class="form-label-custom">Language</label>
                    <select formControlName="language" class="input-field select-field">
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions-custom">
              <span class="save-hint-custom mono">Last saved {{ lastSavedText }}</span>
              <button type="button" class="btn-ghost" (click)="discardChanges()" [disabled]="profileForm.pristine || submitting">Discard changes</button>
              <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || submitting">
                <i class="ti ti-device-floppy"></i> {{ submitting ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Sticky Live Preview Side -->
        <div class="preview-side">
          
          <!-- Live Preview Card -->
          <div class="preview-card teammate-card">
            <div class="preview-header">
              <span class="preview-title">Teammate Live Card</span>
              <span class="active-dot-glow"></span>
            </div>
            
            <div class="preview-body teammate-body">
              <div class="status-indicator">
                <span class="status-dot online"></span>
                <span class="status-text font-mono">Active Now</span>
              </div>
              
              <div class="teammate-profile-section">
                <div class="teammate-avatar-ring">
                  <app-avatar [name]="profileForm.get('name')?.value || authService.currentUser()?.name || ''" 
                              [src]="authService.currentUser()?.avatar || ''" 
                              size="xl"></app-avatar>
                </div>
                <div class="teammate-info">
                  <h4 class="teammate-name">{{ profileForm.get('name')?.value || 'Your Name' }}</h4>
                  <p class="teammate-handle">&#64;{{ profileForm.get('displayName')?.value || 'username' }}</p>
                  <span class="role-badge">{{ authService.currentUser()?.role || 'Teammate' }}</span>
                </div>
              </div>
              
              <div class="teammate-meta-grid">
                <div class="t-meta-item">
                  <i class="ti ti-briefcase"></i>
                  <div class="t-meta-text">
                    <span class="t-meta-label">Title</span>
                    <span class="t-meta-value">{{ profileForm.get('jobTitle')?.value || 'Product Manager' }}</span>
                  </div>
                </div>
                <div class="t-meta-item">
                  <i class="ti ti-building"></i>
                  <div class="t-meta-text">
                    <span class="t-meta-label">Department</span>
                    <span class="t-meta-value">{{ profileForm.get('department')?.value || 'Product Management' }}</span>
                  </div>
                </div>
                <div class="t-meta-item">
                  <i class="ti ti-clock"></i>
                  <div class="t-meta-text">
                    <span class="t-meta-label">Local Time</span>
                    <span class="t-meta-value">{{ getLocalTime() }}</span>
                  </div>
                </div>
                <div class="t-meta-item">
                  <i class="ti ti-world"></i>
                  <div class="t-meta-text">
                    <span class="t-meta-label">Timezone</span>
                    <span class="t-meta-value">{{ profileForm.get('timezone')?.value }}</span>
                  </div>
                </div>
              </div>

              <div class="teammate-bio-bubble">
                <span class="quote-mark">“</span>
                <p class="teammate-bio-text">{{ profileForm.get('bio')?.value || 'Workspace administrator and manager.' }}</p>
                <span class="quote-mark">”</span>
              </div>
            </div>
          </div>

          <!-- Profile Strength Card -->
          <div class="preview-card strength-card animate-fade-in" style="animation-delay: 200ms;">
            <div class="preview-header">
              <span class="preview-title">Profile Strength</span>
              <span class="strength-percentage mono">{{ getProfileStrength() }}%</span>
            </div>
            <div class="preview-body strength-body">
              <div class="progress-bar-container">
                <div class="progress-bar-fill" [style.width.%]="getProfileStrength()"></div>
              </div>
              <div class="strength-checklist">
                <div class="checklist-item" [class.checked]="profileForm.get('name')?.value">
                  <i class="ti" [class.ti-circle-check]="profileForm.get('name')?.value" [class.ti-circle]="!profileForm.get('name')?.value"></i>
                  <span>Full Name provided</span>
                </div>
                <div class="checklist-item" [class.checked]="profileForm.get('displayName')?.value">
                  <i class="ti" [class.ti-circle-check]="profileForm.get('displayName')?.value" [class.ti-circle]="!profileForm.get('displayName')?.value"></i>
                  <span>Display name/handle chosen</span>
                </div>
                <div class="checklist-item" [class.checked]="authService.currentUser()?.avatar">
                  <i class="ti" [class.ti-circle-check]="authService.currentUser()?.avatar" [class.ti-circle]="!authService.currentUser()?.avatar"></i>
                  <span>Avatar photo uploaded</span>
                </div>
                <div class="checklist-item" [class.checked]="profileForm.get('jobTitle')?.value">
                  <i class="ti" [class.ti-circle-check]="profileForm.get('jobTitle')?.value" [class.ti-circle]="!profileForm.get('jobTitle')?.value"></i>
                  <span>Job Title added</span>
                </div>
                <div class="checklist-item" [class.checked]="profileForm.get('bio')?.value">
                  <i class="ti" [class.ti-circle-check]="profileForm.get('bio')?.value" [class.ti-circle]="!profileForm.get('bio')?.value"></i>
                  <span>Short biography written</span>
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
      max-width: 1200px;
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

    /* Banner Style */
    .profile-banner {
      position: relative;
      height: 160px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%);
      border: 1px solid var(--border-default);
      overflow: visible;
      margin-bottom: 72px;
      box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
    }
    
    .profile-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
      border-radius: var(--radius-lg);
    }

    .banner-content {
      position: absolute;
      bottom: -40px;
      left: 32px;
      display: flex;
      align-items: flex-end;
      gap: 24px;
      width: calc(100% - 64px);
    }

    .avatar-wrapper {
      position: relative;
    }

    .avatar-ring-large {
      width: 112px;
      height: 112px;
      border-radius: 50%;
      border: 4px solid var(--bg-void);
      background: var(--bg-surface);
      cursor: pointer;
      overflow: hidden;
      position: relative;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      transition: border-color var(--duration-base), transform var(--duration-base);
    }

    .avatar-ring-large:hover {
      border-color: var(--accent);
      transform: scale(1.02);
    }

    ::ng-deep .avatar-ring-large .avatar.xl {
      width: 104px !important;
      height: 104px !important;
      font-size: 32px !important;
    }

    .avatar-overlay-cam {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(8, 10, 15, 0.75);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      opacity: 0;
      transition: opacity var(--duration-base);
      font-size: 11px;
      color: #ffffff;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .avatar-ring-large:hover .avatar-overlay-cam {
      opacity: 1;
    }

    .avatar-overlay-cam i {
      font-size: 20px;
    }

    .banner-text {
      padding-bottom: 48px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .name-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .banner-user-name {
      font-family: var(--font-display);
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .banner-user-handle {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text-accent);
      margin: 0;
      opacity: 0.95;
    }

    .banner-user-sub {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    /* Grid Layout */
    .profile-layout-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 32px;
      align-items: start;
    }

    .form-side {
      display: flex;
      flex-direction: column;
    }

    .preview-side {
      position: sticky;
      top: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Cards in Form Side */
    .form-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      overflow: hidden;
      box-shadow: 0 4px 20px -6px rgba(0, 0, 0, 0.1);
      transition: border-color var(--duration-base), box-shadow var(--duration-base);
    }
    
    .form-card:hover {
      border-color: var(--border-strong);
      box-shadow: 0 8px 30px -10px rgba(0, 0, 0, 0.15);
    }

    .card-header-custom {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.01);
    }

    .card-header-custom i {
      font-size: 20px;
      color: var(--accent);
    }

    .card-header-custom h4 {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
    }

    .card-body-custom {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .preview-title {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .active-dot-glow {
      width: 8px;
      height: 8px;
      background-color: var(--status-active);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--status-active);
    }

    /* Teammate Card styling */
    .teammate-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
      transition: border-color var(--duration-base);
    }

    .teammate-card:hover {
      border-color: var(--accent-glow);
    }

    .teammate-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      padding: 4px 10px;
      background: var(--bg-void);
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
    }

    .status-dot.online {
      width: 8px;
      height: 8px;
      background: var(--status-active);
      border-radius: 50%;
      box-shadow: 0 0 6px var(--status-active);
    }

    .status-text {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .teammate-profile-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .teammate-avatar-ring {
      border: 2px solid var(--border-default);
      border-radius: 50%;
      padding: 2px;
      transition: border-color var(--duration-base);
    }

    .teammate-avatar-ring:hover {
      border-color: var(--accent);
    }

    ::ng-deep .teammate-avatar-ring .avatar.xl {
      width: 60px !important;
      height: 60px !important;
      font-size: 20px !important;
    }

    .teammate-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .teammate-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .teammate-handle {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-accent);
      margin: 0;
    }

    .role-badge {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid var(--border-accent);
    }

    .teammate-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 16px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }

    .t-meta-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .t-meta-item i {
      font-size: 16px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .t-meta-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .t-meta-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .t-meta-value {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .teammate-bio-bubble {
      background: var(--bg-void);
      border-radius: var(--radius-md);
      padding: 16px;
      position: relative;
      border: 1px solid var(--border-subtle);
    }

    .quote-mark {
      font-family: Georgia, serif;
      font-size: 24px;
      color: var(--accent);
      line-height: 0;
      position: absolute;
      opacity: 0.3;
    }

    .quote-mark:first-of-type {
      top: 14px;
      left: 8px;
    }

    .quote-mark:last-of-type {
      bottom: -2px;
      right: 8px;
    }

    .teammate-bio-text {
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--text-secondary);
      font-style: italic;
      margin: 0;
      padding: 0 10px;
    }

    /* Strength card */
    .strength-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.12);
    }

    .strength-percentage {
      color: var(--accent);
      font-weight: 600;
      font-size: 13px;
    }

    .strength-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: var(--bg-void);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent) 0%, var(--accent-glow) 100%);
      border-radius: 3px;
      transition: width var(--duration-slow) var(--ease-out-expo);
      box-shadow: 0 0 8px var(--accent-glow);
    }

    .strength-checklist {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: var(--text-muted);
      transition: color var(--duration-base);
    }

    .checklist-item.checked {
      color: var(--text-secondary);
    }

    .checklist-item i {
      font-size: 14px;
      transition: color var(--duration-base);
    }

    .checklist-item.checked i {
      color: var(--status-active);
    }

    .settings-form {
      display: flex;
      flex-direction: column;
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

    .disabled-field {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--bg-void) !important;
    }

    .hint-text {
      font-size: 11px;
      color: var(--text-muted);
    }

    .error-msg {
      font-size: 11px;
      color: var(--status-danger);
    }

    .textarea-field {
      resize: vertical;
    }

    .select-field {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238892A4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 16px;
      padding-right: 40px;
    }

    .form-actions-custom {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 12px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }

    .save-hint-custom {
      margin-right: auto;
      font-size: 12px;
      color: var(--text-muted);
    }

    @media (max-width: 1024px) {
      .profile-layout-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .preview-side {
        position: relative;
        top: 0;
      }
    }

    @media (max-width: 768px) {
      .settings-content {
        padding: 24px;
      }
      .banner-content {
        left: 20px;
        width: calc(100% - 40px);
        flex-direction: column;
        align-items: flex-start;
        bottom: -90px;
      }
      .profile-banner {
        margin-bottom: 110px;
      }
      .banner-text {
        padding-bottom: 0;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);

  profileForm!: FormGroup;
  submitting = false;
  lastSavedText = 'never';

  getLocalTime(): string {
    const tz = this.profileForm?.get('timezone')?.value || 'UTC';
    let timeZoneString = 'UTC';
    if (tz === 'IST') timeZoneString = 'Asia/Kolkata';
    else if (tz === 'EST') timeZoneString = 'America/New_York';
    else if (tz === 'PST') timeZoneString = 'America/Los_Angeles';
    else if (tz === 'GMT') timeZoneString = 'Europe/London';
    
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: timeZoneString,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }

  getProfileStrength(): number {
    if (!this.profileForm) return 0;
    let score = 0;
    if (this.profileForm.get('name')?.value) score += 20;
    if (this.profileForm.get('displayName')?.value) score += 20;
    if (this.authService.currentUser()?.avatar) score += 20;
    if (this.profileForm.get('jobTitle')?.value) score += 20;
    if (this.profileForm.get('bio')?.value) score += 20;
    return score;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const storedProfile = JSON.parse(localStorage.getItem(`profile_${user?.id}`) || '{}');

    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.maxLength(50)]],
      displayName: [storedProfile.displayName || user?.name?.toLowerCase().replace(' ', '_') || ''],
      email: [{ value: user?.email || '', disabled: true }],
      phone: [storedProfile.phone || ''],
      jobTitle: [storedProfile.jobTitle || 'Product Manager'],
      department: [storedProfile.department || 'Product Management'],
      bio: [storedProfile.bio || 'Workspace administrator and manager.'],
      timezone: [storedProfile.timezone || 'IST'],
      language: [storedProfile.language || 'en']
    });
  }

  triggerAvatarUpload(): void {
    const fileInput = document.getElementById('avatarFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onAvatarFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('File exceeds 2MB limit', 'Close', { duration: 3000 });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const user = this.authService.currentUser();
        if (user) {
          this.authService.currentUser.set({
            ...user,
            avatar: reader.result as string
          });
          this.snackBar.open('Avatar updated', 'Close', { duration: 3000 });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  discardChanges(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        displayName: user.name.toLowerCase().replace(' ', '_')
      });
      this.profileForm.markAsPristine();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    this.submitting = true;
    const user = this.authService.currentUser();
    if (!user) return;

    this.userService.updateUserProfile(user.id, this.profileForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.authService.currentUser.set({
            ...user,
            name: res.data.name,
            avatar: user.avatar // preserve avatar state
          });
          
          // Persist metadata locally
          localStorage.setItem(`profile_${user.id}`, JSON.stringify(this.profileForm.value));
          
          this.profileForm.markAsPristine();
          this.lastSavedText = 'just now';
          this.snackBar.open('Profile saved successfully', 'Close', { duration: 3000 });
        }
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
      }
    });
  }
}
