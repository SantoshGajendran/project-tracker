import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-edit-teammate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Teammate Information</h2>
    <mat-dialog-content>
      <form [formGroup]="teammateForm" class="dialog-form" style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="teammateForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Email Address</mat-label>
          <input matInput type="email" formControlName="email" required />
          <mat-error *ngIf="teammateForm.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="teammateForm.get('email')?.hasError('email')">Invalid email format</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="MEMBER">Teammate</mat-option>
            <mat-option value="TEAM_LEAD">Team Lead</mat-option>
            <mat-option value="MANAGER">Manager</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Avatar Image URL (Optional)</mat-label>
          <input matInput formControlName="avatar" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="teammateForm.invalid || submitting" (click)="onSubmit()">
        {{ submitting ? 'Saving...' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `
})
export class EditTeammateDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  userService = inject(UserService);
  authService = inject(AuthService);
  dialogRef = inject(MatDialogRef<EditTeammateDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  teammateForm: FormGroup;
  submitting = false;

  constructor() {
    this.teammateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['MEMBER', Validators.required],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.member) {
      this.teammateForm.patchValue({
        name: this.data.member.name,
        email: this.data.member.email,
        role: this.data.member.role,
        avatar: this.data.member.avatar || ''
      });
      if (!this.authService.isManager()) {
        this.teammateForm.get('email')?.disable();
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.teammateForm.invalid) return;
    this.submitting = true;
    this.userService.updateUserProfile(this.data.member.id, this.teammateForm.getRawValue()).subscribe({
      next: (res) => {
        if (res.success) {
          this.dialogRef.close(true);
        } else {
          this.submitting = false;
        }
      },
      error: () => this.submitting = false
    });
  }
}