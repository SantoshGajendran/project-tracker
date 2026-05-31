import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectStatus, ProjectPriority } from '../../core/models/models';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    BadgeComponent,
    ProgressBarComponent,
    EmptyStateComponent
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projectService = inject(ProjectService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  
  // Filters
  selectedStatus: string = '';
  selectedPriority: string = '';
  searchQuery: string = '';

  viewMode: 'grid' | 'kanban' = 'grid'; // Grid/Kanban Toggle
  loading = true;

  // Kanban status columns
  kanbanColumns: { status: ProjectStatus; label: string }[] = [
    { status: 'PLANNING', label: 'Planning' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'ON_HOLD', label: 'On Hold' },
    { status: 'COMPLETED', label: 'Completed' }
  ];

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe({
      next: (res) => {
        if (res.success) {
          this.projects = res.data.content || [];
          this.applyFilters();
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filteredProjects = this.projects.filter(p => {
      const matchStatus = !this.selectedStatus || p.status === this.selectedStatus;
      const matchPriority = !this.selectedPriority || p.priority === this.selectedPriority;
      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

      return matchStatus && matchPriority && matchSearch;
    });
  }

  getProjectsByStatus(status: ProjectStatus): Project[] {
    return this.filteredProjects.filter(p => p.status === status);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Project created successfully', 'Close', { duration: 3000 });
        this.loadProjects();
      }
    });
  }
}

// CREATE DIALOG COMPONENT
@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <mat-dialog-content>
      <form [formGroup]="projectForm" class="dialog-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">Project name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" required>
              <mat-option value="PLANNING">Planning</mat-option>
              <mat-option value="IN_PROGRESS">In Progress</mat-option>
              <mat-option value="ON_HOLD">On Hold</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority" required>
              <mat-option value="LOW">Low</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="HIGH">High</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" required />
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="duePicker" formControlName="dueDate" required />
            <mat-datepicker-toggle matSuffix [for]="duePicker"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="projectForm.invalid || submitting" (click)="onSubmit()">
        {{ submitting ? 'Creating...' : 'Create Project' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 8px;
    }
    .w-full { width: 100%; }
    .row {
      display: flex;
      gap: 16px;
      width: 100%;
    }
    .half {
      flex: 1;
    }
  `]
})
export class CreateProjectDialogComponent {
  fb = inject(FormBuilder);
  projectService = inject(ProjectService);
  dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);

  projectForm: FormGroup;
  submitting = false;

  constructor() {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      status: ['PLANNING', Validators.required],
      priority: ['MEDIUM', Validators.required],
      startDate: [new Date(), Validators.required],
      dueDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;
    this.submitting = true;

    const val = this.projectForm.value;
    // Format dates to ISO-8601 strings (YYYY-MM-DD)
    const formatted = {
      ...val,
      startDate: this.formatDate(val.startDate),
      dueDate: this.formatDate(val.dueDate)
    };

    this.projectService.createProject(formatted).subscribe({
      next: (res) => {
        if (res.success) {
          this.dialogRef.close(true);
        } else {
          this.submitting = false;
        }
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}
