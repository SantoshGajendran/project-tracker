import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, CdkDragStart, CdkDragRelease, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { SprintService } from '../../../core/services/sprint.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectDetail, Task, TaskStatus, TaskPriority, Sprint, ProjectMember, ActivityLog, User, ProjectMemberRole, ProjectStatus } from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ProgressBarComponent } from '../../../shared/progress-bar/progress-bar.component';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { SpringPhysicsService } from '../../../core/services/spring-physics.service';
import { SpringCardDirective } from '../../../shared/directives/spring-card.directive';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    DragDropModule,
    BadgeComponent,
    ProgressBarComponent,
    AvatarComponent,
    EmptyStateComponent,
    SpringCardDirective
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  projectService = inject(ProjectService);
  taskService = inject(TaskService);
  sprintService = inject(SprintService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);
  springService = inject(SpringPhysicsService);

  projectId!: number;
  detail?: ProjectDetail;
  tasks: Task[] = [];
  sprints: Sprint[] = [];
  activities: ActivityLog[] = [];
  
  loading = true;

  // Board columns
  boardLanes: { status: TaskStatus; label: string; tasks: Task[] }[] = [
    { status: 'TODO', label: 'To Do', tasks: [] },
    { status: 'IN_PROGRESS', label: 'In Progress', tasks: [] },
    { status: 'IN_REVIEW', label: 'In Review', tasks: [] },
    { status: 'DONE', label: 'Done', tasks: [] }
  ];

  // Backlog
  backlogTasks: Task[] = [];

  // Active Sprints
  activeSprints: Sprint[] = [];

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProjectDetails();
  }

  loadProjectDetails(): void {
    this.loading = true;
    this.projectService.getProjectDetails(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.detail = res.data;
          this.loadTasks();
          this.loadSprints();
          this.loadActivity();
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  loadTasks(): void {
    this.projectService.getProjectTasks(this.projectId, undefined, undefined, undefined, undefined, 0, 1000).subscribe({
      next: (res) => {
        if (res.success) {
          this.tasks = res.data.content || [];
          this.distributeTasksToBoard();
          this.backlogTasks = this.tasks;
        }
      }
    });
  }

  loadSprints(): void {
    this.projectService.getProjectSprints(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.sprints = res.data || [];
          this.activeSprints = this.sprints.filter(s => s.status !== 'COMPLETED');
        }
      }
    });
  }

  loadActivity(): void {
    this.projectService.getProjectActivity(this.projectId, 0, 20).subscribe({
      next: (res) => {
        if (res.success) {
          this.activities = res.data.content || [];
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  distributeTasksToBoard(): void {
    // Reset columns
    this.boardLanes.forEach(lane => lane.tasks = []);

    // Distribute
    this.tasks.forEach(task => {
      const lane = this.boardLanes.find(l => l.status === task.status);
      if (lane) {
        lane.tasks.push(task);
      }
    });
  }

  // Board drag & drop status updater
  onTaskDropped(event: CdkDragDrop<Task[]>): void {
    const el = event.item.element.nativeElement as HTMLElement;
    
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.animateCardEntrance(el);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const targetStatus = event.container.id as TaskStatus;

      // Optimistic UI update
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Trigger spring entrance animations
      if (targetStatus === 'DONE') {
        this.animateDoneEntrance(el);
      } else {
        this.animateCardEntrance(el);
      }

      // Call API
      this.taskService.patchStatus(task.id, targetStatus).subscribe({
        next: (res) => {
          if (res.success) {
            task.status = targetStatus;
            this.snackBar.open(`Task status updated to ${targetStatus}`, 'Close', { duration: 2000 });
            
            // Recalculate progress locally
            this.updateProjectProgressLocally();
          }
        },
        error: () => {
          // Revert on error
          this.loadTasks();
          this.snackBar.open('Failed to update task status', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onDragStarted(event: CdkDragStart): void {
    const el = event.source.element.nativeElement as HTMLElement;
    this.springService.animateMulti(el, {
      '--card-scale':   { from: 1,    to: 0.96 },
      '--card-rotate':  { from: 0,    to: 2.5    },
      '--card-opacity': { from: 1,    to: 0.6  },
    }, this.springService.CONFIGS.snappy);
  }

  onDragReleased(event: CdkDragRelease): void {
    const el = event.source.element.nativeElement as HTMLElement;
    this.springService.animateMulti(el, {
      '--card-scale':   { from: 0.96, to: 1 },
      '--card-rotate':  { from: 2.5,    to: 0 },
      '--card-opacity': { from: 0.6,  to: 1 },
    }, this.springService.CONFIGS.bouncy);
  }

  private animateCardEntrance(el: HTMLElement): void {
    el.style.setProperty('--card-translate-y', '12');
    el.style.setProperty('--card-opacity', '0');

    this.springService.animate(el, '--card-translate-y', 12, 0, this.springService.CONFIGS.bouncy);
    this.springService.animate(el, '--card-opacity', 0, 1, this.springService.CONFIGS.gentle);
    this.springService.animate(el, '--card-scale', 0.95, 1, this.springService.CONFIGS.bouncy);
  }

  private animateDoneEntrance(el: HTMLElement): void {
    this.springService.animate(el, '--card-scale', 0.9, 1.08, this.springService.CONFIGS.bouncy, () => {
      this.springService.animate(el, '--card-scale', 1.08, 1, this.springService.CONFIGS.snappy);
    });

    this.springService.animate(el, '--done-glow', 0, 1, this.springService.CONFIGS.instant, () => {
      this.springService.animate(el, '--done-glow', 1, 0, this.springService.CONFIGS.gentle);
    });
  }

  updateProjectProgressLocally(): void {
    if (!this.detail) return;
    const completed = this.tasks.filter(t => t.status === 'DONE').length;
    const total = this.tasks.length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.detail.project.progress = newProgress;
  }

  // Status modifier from top panel (For manager only)
  onProjectStatusChange(status: string): void {
    if (!this.detail) return;
    const updatedProject = { ...this.detail.project, status: status as ProjectStatus };
    
    this.projectService.updateProject(this.projectId, updatedProject).subscribe({
      next: (res) => {
        if (res.success) {
          this.detail!.project.status = status as ProjectStatus;
          this.snackBar.open(`Project status updated to ${status}`, 'Close', { duration: 3000 });
          this.loadActivity();
        }
      }
    });
  }

  deleteProject(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Project',
        message: 'Are you sure you want to delete this project? This action is permanent and will delete all associated tasks, sprints, and members.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.projectService.deleteProject(this.projectId).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Project deleted successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/projects']);
            } else {
              this.snackBar.open(res.message || 'Failed to delete project', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error deleting project', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // Sprint lifecycle
  startSprint(sprintId: number): void {
    this.sprintService.startSprint(sprintId).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Sprint started', 'Close', { duration: 3000 });
          this.loadSprints();
          this.loadActivity();
        }
      }
    });
  }

  completeSprint(sprintId: number): void {
    this.sprintService.completeSprint(sprintId).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Sprint completed', 'Close', { duration: 3000 });
          this.loadSprints();
          this.loadTasks();
          this.loadActivity();
        }
      }
    });
  }

  // Members mapping
  openAssignMemberDialog(): void {
    const dialogRef = this.dialog.open(AssignMemberDialogComponent, {
      width: '400px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Team member assigned', 'Close', { duration: 3000 });
        this.loadProjectDetails();
      }
    });
  }

  removeMember(userId: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Remove Member',
        message: 'Are you sure you want to remove this member from the project?',
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.projectService.removeMember(this.projectId, userId).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Member removed', 'Close', { duration: 3000 });
              this.loadProjectDetails();
            }
          }
        });
      }
    });
  }

  // Create Task dialog
  openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectTaskDialogComponent, {
      width: '500px',
      data: { projectId: this.projectId, members: this.detail?.members || [], sprints: this.sprints }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created', 'Close', { duration: 3000 });
        this.loadProjectDetails();
      }
    });
  }

  // Create Sprint dialog
  openCreateSprintDialog(): void {
    const dialogRef = this.dialog.open(CreateSprintDialogComponent, {
      width: '450px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Sprint created', 'Close', { duration: 3000 });
        this.loadSprints();
        this.loadActivity();
      }
    });
  }
}

// DIALOG: ASSIGN MEMBER
@Component({
  selector: 'app-assign-member-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSelectModule, MatButtonModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>Assign Member</h2>
    <mat-dialog-content>
      <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
        <mat-form-field appearance="outline">
          <mat-label>User</mat-label>
          <mat-select [(value)]="selectedUserId">
            <mat-option *ngFor="let u of availableUsers" [value]="u.id">
              {{ u.name }} ({{ u.role }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Role in Project</mat-label>
          <mat-select [(value)]="selectedRole">
            <mat-option value="CONTRIBUTOR">Contributor</mat-option>
            <mat-option value="VIEWER">Viewer</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!selectedUserId || submitting" (click)="onSubmit()">
        Assign
      </button>
    </mat-dialog-actions>
  `
})
export class AssignMemberDialogComponent implements OnInit {
  userService = inject(UserService);
  projectService = inject(ProjectService);
  dialogRef = inject(MatDialogRef<AssignMemberDialogComponent>);
  public data: { projectId: number } = inject(MAT_DIALOG_DATA);

  availableUsers: User[] = [];
  selectedUserId?: number;
  selectedRole: string = 'CONTRIBUTOR';
  submitting = false;

  ngOnInit(): void {
    this.userService.getUsers().subscribe(res => {
      if (res.success) {
        // filter out users already in project
        this.projectService.getMembers(this.data.projectId).subscribe(membersRes => {
          if (membersRes.success) {
            const memberIds = membersRes.data.map(m => m.userId);
            this.availableUsers = res.data.filter(u => !memberIds.includes(u.id));
          }
        });
      }
    });
  }

  onSubmit(): void {
    if (!this.selectedUserId) return;
    this.submitting = true;
    this.projectService.assignMember(this.data.projectId, {
      userId: this.selectedUserId,
      role: this.selectedRole
    }).subscribe({
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

// DIALOG: CREATE TASK
@Component({
  selector: 'app-create-project-task-dialog',
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
    <h2 mat-dialog-title>Create Project Task</h2>
    <mat-dialog-content>
      <form [formGroup]="taskForm" class="dialog-form" style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
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
              <mat-option *ngFor="let m of data.members" [value]="m.userId">
                {{ m.userName }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Sprint</mat-label>
            <mat-select formControlName="sprintId">
              <mat-option [value]="null">Backlog (No Sprint)</mat-option>
              <mat-option *ngFor="let s of data.sprints" [value]="s.id">
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
export class CreateProjectTaskDialogComponent {
  fb = inject(FormBuilder);
  taskService = inject(TaskService);
  dialogRef = inject(MatDialogRef<CreateProjectTaskDialogComponent>);
  public data: { projectId: number; members: ProjectMember[]; sprints: Sprint[] } = inject(MAT_DIALOG_DATA);

  taskForm: FormGroup;
  submitting = false;

  constructor() {
    this.taskForm = this.fb.group({
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

  onSubmit(): void {
    if (this.taskForm.invalid) return;
    this.submitting = true;

    const val = this.taskForm.value;
    const formatted = {
      ...val,
      projectId: this.data.projectId,
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

// DIALOG: CREATE SPRINT
@Component({
  selector: 'app-create-sprint-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Create Sprint</h2>
    <mat-dialog-content>
      <form [formGroup]="sprintForm" class="dialog-form" style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sprint Name</mat-label>
          <input matInput formControlName="name" required placeholder="Sprint 1: Core Tasks" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Goal</mat-label>
          <textarea matInput formControlName="goal" rows="2" placeholder="What is the objective of this sprint?"></textarea>
        </mat-form-field>

        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" required />
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" required />
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="sprintForm.invalid || submitting" (click)="onSubmit()">
        Create Sprint
      </button>
    </mat-dialog-actions>
  `
})
export class CreateSprintDialogComponent {
  fb = inject(FormBuilder);
  sprintService = inject(SprintService);
  dialogRef = inject(MatDialogRef<CreateSprintDialogComponent>);
  public data: { projectId: number } = inject(MAT_DIALOG_DATA);

  sprintForm: FormGroup;
  submitting = false;

  constructor() {
    this.sprintForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      goal: [''],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), Validators.required]
    });
  }

  onSubmit(): void {
    if (this.sprintForm.invalid) return;
    this.submitting = true;

    const val = this.sprintForm.value;
    const formatted = {
      ...val,
      projectId: this.data.projectId,
      startDate: this.formatDate(val.startDate),
      endDate: this.formatDate(val.endDate)
    };

    this.sprintService.createSprint(formatted).subscribe({
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
