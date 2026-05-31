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

      <div class="avatar-editor">
        <div class="avatar-ring" (click)="triggerAvatarUpload()">
          <app-avatar [name]="authService.currentUser()?.name || ''" [src]="authService.currentUser()?.avatar || ''" size="xl"></app-avatar>
          <div class="avatar-overlay">
            <i class="ti ti-camera"></i>
            <span>Change</span>
          </div>
        </div>
        <div class="avatar-meta">
          <p class="avatar-name">{{ authService.currentUser()?.name }}</p>
          <p class="avatar-role">{{ authService.currentUser()?.role }}</p>
          <p class="avatar-hint">Click avatar to upload · PNG or JPG · max 2MB</p>
        </div>
        <input type="file" id="avatarFileInput" style="display: none;" (change)="onAvatarFileSelected($event)" accept="image/*">
      </div>

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="settings-form">
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

        <div class="form-grid-2">
          <div class="form-group-custom">
            <label class="form-label-custom">Job Title</label>
            <input type="text" formControlName="jobTitle" class="input-field" placeholder="e.g. Senior Frontend Developer" />
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

        <div class="form-actions-custom">
          <span class="save-hint-custom mono">Last saved {{ lastSavedText }}</span>
          <button type="button" class="btn-ghost" (click)="discardChanges()" [disabled]="profileForm.pristine || submitting">Discard changes</button>
          <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || submitting">
            <i class="ti ti-device-floppy"></i> {{ submitting ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </form>
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

    .avatar-editor {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      padding: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .avatar-ring {
      width: 80px;
      height: 80px;
      position: relative;
      cursor: pointer;
      border-radius: 50%;
      border: 2px solid var(--border-default);
      transition: border-color var(--duration-base);
      overflow: hidden;
    }

    .avatar-ring:hover {
      border-color: var(--accent);
    }

    .avatar-ring:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(8, 10, 15, 0.75);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      opacity: 0;
      transition: opacity var(--duration-base);
      font-size: 11px;
      color: #ffffff;
    }

    .avatar-overlay i {
      font-size: 16px;
    }

    .avatar-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .avatar-name {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
    }

    .avatar-role {
      display: inline-block;
      align-self: flex-start;
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid var(--border-accent);
      margin: 0;
    }

    .avatar-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
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

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
        gap: 16px;
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

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.maxLength(50)]],
      displayName: [user?.name?.toLowerCase().replace(' ', '_') || ''],
      email: [{ value: user?.email || '', disabled: true }],
      phone: [''],
      jobTitle: ['Product Manager'],
      department: ['Product Management'],
      bio: ['Workspace administrator and manager.'],
      timezone: ['IST'],
      language: ['en']
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
