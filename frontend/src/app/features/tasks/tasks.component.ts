import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority, Project, User } from '../../core/models/models';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-tasks',
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
    AvatarComponent,
    EmptyStateComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  taskService = inject(TaskService);
  projectService = inject(ProjectService);
  userService = inject(UserService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  route = inject(ActivatedRoute);

  tasks: Task[] = [];
  projects: Project[] = [];
  users: User[] = [];

  // Filter bindings
  selectedProjectId: string = '';
  selectedAssigneeId: string = '';
  selectedStatus: string = '';
  selectedPriority: string = '';
  searchQuery: string = '';

  loading = true;
  today = new Date();

  ngOnInit(): void {
    // Capture global search query parameter if redirected from topbar
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      this.loadInitialData();
    });
  }

  loadInitialData(): void {
    this.loading = true;
    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe(resProjects => {
      if (resProjects.success) {
        this.projects = resProjects.data.content || [];
      }
      this.userService.getUsers().subscribe(resUsers => {
        if (resUsers.success) {
          this.users = resUsers.data || [];
        }
        this.loadTasks();
      });
    });
  }

  loadTasks(): void {
    this.loading = true;
    const projId = this.selectedProjectId ? Number(this.selectedProjectId) : undefined;
    const assId = this.selectedAssigneeId ? Number(this.selectedAssigneeId) : undefined;
    const stat = this.selectedStatus || undefined;
    const prio = this.selectedPriority || undefined;
    const search = this.searchQuery || undefined;

    this.taskService.getTasks(projId, assId, stat, prio, undefined, search, 0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.tasks = res.data.content || [];
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onStatusChange(taskId: number, status: string): void {
    this.taskService.patchStatus(taskId, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Task status updated', 'Close', { duration: 3000 });
          this.loadTasks();
        }
      }
    });
  }

  isOverdue(task: Task): boolean {
    if (task.status === 'DONE' || !task.dueDate) return false;
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    return due.getTime() < this.today.getTime();
  }

  openCreateTaskModal(): void {
    const dialogRef = this.dialog.open(CreateGlobalTaskDialogComponent, {
      width: '500px',
      data: { projects: this.projects, users: this.users }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
        this.loadTasks();
      }
    });
  }

  deleteTask(id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Task',
        message: 'Are you sure you want to delete this task? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTask(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
              this.loadTasks();
            }
          }
        });
      }
    });
  }
}

// GLOBAL DIALOG: CREATE TASK
@Component({
  selector: 'app-create-global-task-dialog',
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
    <h2 mat-dialog-title>Create New Task</h2>
    <mat-dialog-content>
      <form [formGroup]="taskForm" class="dialog-form" style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Project</mat-label>
          <mat-select formControlName="projectId" required (selectionChange)="onProjectSelected($event.value)">
            <mat-option *ngFor="let p of data.projects" [value]="p.id">
              {{ p.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Task Title</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" required>
              <mat-option value="TODO">To Do</mat-option>
              <mat-option value="IN_PROGRESS">In Progress</mat-option>
              <mat-option value="IN_REVIEW">In Review</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority" required>
              <mat-option value="LOW">Low</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="HIGH">High</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Assignee</mat-label>
            <mat-select formControlName="assignedToId">
              <mat-option [value]="null">Unassigned</mat-option>
              <mat-option *ngFor="let u of data.users" [value]="u.id">
                {{ u.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Sprint</mat-label>
            <mat-select formControlName="sprintId">
              <mat-option [value]="null">Backlog (No Sprint)</mat-option>
              <mat-option *ngFor="let s of sprints" [value]="s.id">
                {{ s.name }} ({{ s.status }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="duePicker" formControlName="dueDate" />
            <mat-datepicker-toggle matSuffix [for]="duePicker"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="taskForm.invalid || submitting" (click)="onSubmit()">
        Create Task
      </button>
    </mat-dialog-actions>
  `
})
export class CreateGlobalTaskDialogComponent {
  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  projectService = inject(ProjectService);
  dialogRef = inject(MatDialogRef<CreateGlobalTaskDialogComponent>);
  public data: { projects: Project[]; users: User[] } = inject(MAT_DIALOG_DATA);

  taskForm: FormGroup;
  sprints: any[] = [];
  submitting = false;

  constructor() {
    this.taskForm = this.fb.group({
      projectId: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      status: ['TODO', Validators.required],
      priority: ['MEDIUM', Validators.required],
      storyPoints: [1, [Validators.required, Validators.min(0)]],
      assignedToId: [null],
      sprintId: [null],
      dueDate: [null]
    });
  }

  onProjectSelected(projectId: number): void {
    this.projectService.getProjectSprints(projectId).subscribe(res => {
      if (res.success) {
        this.sprints = res.data || [];
        this.taskForm.patchValue({ sprintId: null });
      }
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) return;
    this.submitting = true;

    const val = this.taskForm.value;
    const formatted = {
      ...val,
      dueDate: val.dueDate ? this.formatDate(val.dueDate) : null
    };

    this.taskService.createTask(formatted).subscribe({
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

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}
