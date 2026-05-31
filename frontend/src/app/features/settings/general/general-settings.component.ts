import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>General Workspace Settings</h2>
        <p>Manage your workspace naming, routing slug, identifiers and metadata</p>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Workspace Information</h3>
          <p>These settings identify your team workspace to other workspace members.</p>
        </div>

        <form [formGroup]="generalForm" (ngSubmit)="onSubmit()" class="settings-form">
          <div class="form-grid-2">
            <div class="form-group-custom">
              <label class="form-label-custom">Workspace Name*</label>
              <input type="text" formControlName="workspaceName" class="input-field" placeholder="e.g. ProjectFlow" required />
            </div>

            <div class="form-group-custom">
              <label class="form-label-custom">Workspace Slug*</label>
              <div class="slug-input-wrapper">
                <span class="slug-prefix font-mono">projectflow.com/</span>
                <input type="text" formControlName="workspaceSlug" class="input-field slug-input" placeholder="e.g. workspace-name" required />
              </div>
            </div>
          </div>

          <div class="form-group-custom">
            <label class="form-label-custom">Workspace Description</label>
            <textarea formControlName="workspaceDesc" class="input-field" placeholder="Explain the purpose of this workspace..." rows="3"></textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-group-custom">
              <label class="form-label-custom">Organization Website</label>
              <input type="url" formControlName="website" class="input-field" placeholder="https://projectflow.com" />
            </div>

            <div class="form-group-custom">
              <label class="form-label-custom">Workspace Logo URL</label>
              <input type="text" formControlName="logoUrl" class="input-field" placeholder="https://company.com/logo.png" />
            </div>
          </div>

          <div class="card-actions-custom">
            <button type="button" class="btn-ghost" (click)="resetForm()" [disabled]="generalForm.pristine || submitting">Discard</button>
            <button type="submit" class="btn-primary" [disabled]="generalForm.invalid || submitting">
              Save Workspace
            </button>
          </div>
        </form>
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

    .slug-input-wrapper {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-void);
      transition: border-color var(--duration-fast);
    }

    .slug-input-wrapper:hover {
      border-color: var(--border-strong);
    }

    .slug-input-wrapper:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .slug-prefix {
      font-size: 12px;
      padding: 10px 0 10px 14px;
      color: var(--text-muted);
      user-select: none;
    }

    .slug-input {
      border: none !important;
      background: transparent !important;
      padding-left: 4px !important;
      box-shadow: none !important;
    }

    .card-actions-custom {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GeneralSettingsComponent implements OnInit {
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);

  generalForm!: FormGroup;
  submitting = false;

  ngOnInit(): void {
    this.generalForm = this.fb.group({
      workspaceName: ['ProjectFlow', [Validators.required]],
      workspaceSlug: ['project-flow', [Validators.required]],
      workspaceDesc: ['Core tracking system for engineering velocity metrics.'],
      website: ['https://projectflow.com'],
      logoUrl: ['']
    });
  }

  resetForm(): void {
    this.generalForm.reset({
      workspaceName: 'ProjectFlow',
      workspaceSlug: 'project-flow',
      workspaceDesc: 'Core tracking system for engineering velocity metrics.',
      website: 'https://projectflow.com',
      logoUrl: ''
    });
    this.generalForm.markAsPristine();
  }

  onSubmit(): void {
    if (this.generalForm.invalid) return;
    this.submitting = true;
    setTimeout(() => {
      this.submitting = false;
      this.generalForm.markAsPristine();
      this.snackBar.open('Workspace settings updated', 'Close', { duration: 3000 });
    }, 1000);
  }
}
