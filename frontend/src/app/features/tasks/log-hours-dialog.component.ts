import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimeEntryService } from '../../core/services/time-entry.service';

@Component({
  selector: 'app-log-hours-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title style="display:flex;align-items:center;gap:8px;margin-bottom:0;">
      <mat-icon style="color:#4CAF50;">access_time</mat-icon>
      Log Hours
    </h2>
    <mat-dialog-content>
      <div style="padding: 8px 0; color: #666; font-size: 13px;">
        Task: <strong>{{ data.taskTitle }}</strong> &mdash; Project: <strong>{{ data.projectName }}</strong>
      </div>
      <div style="background:#f5f5f5;border-radius:8px;padding:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;color:#555;">Current hours logged:</span>
        <span style="font-size:18px;font-weight:600;color:#1976D2;">{{ currentHours }}h / 13h</span>
      </div>
      <div *ngIf="remaining <= 0" style="background:#FFEBEE;border-radius:8px;padding:12px;margin-bottom:16px;color:#C62828;font-size:14px;text-align:center;">
        <mat-icon style="vertical-align:middle;font-size:18px;">warning</mat-icon>
        This task has reached the maximum 13 billable hours limit.
      </div>
      <div *ngIf="errorMessage" style="background:#FFEBEE;border-radius:8px;padding:12px;margin-bottom:16px;color:#C62828;font-size:13px;text-align:center;">
        <mat-icon style="vertical-align:middle;font-size:16px;">error</mat-icon>
        {{ errorMessage }}
      </div>
      <form [formGroup]="hoursForm" style="display:flex;flex-direction:column;gap:16px;padding-top:8px;">
        <mat-form-field appearance="outline">
          <mat-label>Hours</mat-label>
          <input matInput type="number" formControlName="hours" min="0.5" [max]="remaining > 0 ? remaining : 0.5" step="0.5" placeholder="e.g. 2.5" />
          <mat-hint *ngIf="remaining > 0">Remaining capacity: {{ remaining }}h</mat-hint>
          <mat-error *ngIf="hoursForm.get('hours')?.hasError('required')">Hours is required</mat-error>
          <mat-error *ngIf="hoursForm.get('hours')?.hasError('min')">Minimum 0.5 hours</mat-error>
          <mat-error *ngIf="hoursForm.get('hours')?.hasError('max')">Cannot exceed remaining capacity</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="loggedDate" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="What work was done?"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="hoursForm.invalid || submitting || remaining <= 0" (click)="onSubmit()">
        <span *ngIf="!submitting">Log Hours</span>
        <span *ngIf="submitting">Saving...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    mat-dialog-content { min-width: 380px; }
  `]
})
export class LogHoursDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<LogHoursDialogComponent>);
  timeEntryService = inject(TimeEntryService);
  data: { taskId: number; taskTitle: string; projectId: number; projectName: string } = inject(MAT_DIALOG_DATA);

  hoursForm: FormGroup;
  currentHours: number = 0;
  remaining: number = 13;
  submitting = false;
  errorMessage = '';

  constructor() {
    this.hoursForm = this.fb.group({
      hours: [1, [Validators.required, Validators.min(0.5)]],
      loggedDate: [new Date(), Validators.required],
      description: ['']
    });

    // Fetch current hours for this task
    this.loadCurrentHours();
  }

  private loadCurrentHours(): void {
    this.timeEntryService.getTotalHoursForTask(this.data.taskId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentHours = res.data.totalHours || 0;
          this.remaining = Math.max(0, 13 - this.currentHours);
          // Update the max validator
          const hoursControl = this.hoursForm.get('hours');
          if (hoursControl && this.remaining > 0) {
            hoursControl.setValidators([
              Validators.required,
              Validators.min(0.5),
              Validators.max(Math.max(0.5, this.remaining))
            ]);
            hoursControl.updateValueAndValidity();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load task hours:', err);
        this.errorMessage = 'Could not load current hours. Please try again.';
      }
    });
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.hoursForm.invalid || this.remaining <= 0) return;
    this.submitting = true;
    this.errorMessage = '';

    const val = this.hoursForm.value;
    const loggedDate = this.formatDateForApi(val.loggedDate);

    if (!loggedDate) {
      this.errorMessage = 'Invalid date selected.';
      this.submitting = false;
      return;
    }

    this.timeEntryService.createTimeEntry({
      projectId: this.data.projectId,
      taskId: this.data.taskId,
      hours: Number(val.hours),
      description: val.description || '',
      loggedDate: loggedDate
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.snackBar.open('Hours logged successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.errorMessage = res.message || 'Failed to log hours';
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error logging hours:', err);
        // Try to extract backend error message
        const backendMsg = err.error?.message || err.message || '';
        this.errorMessage = backendMsg || 'An unexpected error occurred. Please try again.';
      }
    });
  }
}