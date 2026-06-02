import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-create-teammate-dialog',
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
    <h2 mat-dialog-title>Create New Teammate</h2>
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
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" required />
          <mat-error *ngIf="teammateForm.get('password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="teammateForm.get('password')?.hasError('minlength')">Must be at least 6 characters</mat-error>
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
        {{ submitting ? 'Creating...' : 'Create Teammate' }}
      </button>
    </mat-dialog-actions>
  `
})
export class CreateTeammateDialogComponent {
  fb = inject(FormBuilder);
  userService = inject(UserService);
  dialogRef = inject(MatDialogRef<CreateTeammateDialogComponent>);

  teammateForm: FormGroup;
  submitting = false;

  constructor() {
    this.teammateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['MEMBER', Validators.required],
      avatar: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.teammateForm.invalid) return;
    this.submitting = true;
    this.userService.createUser(this.teammateForm.value).subscribe({
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