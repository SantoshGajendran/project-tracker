import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { TaskPermissionService } from '../../../core/services/task-permission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, ProjectMember, Sprint, Comment } from '../../../core/models/models';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AvatarComponent,
    BadgeComponent
  ],
  template: `
    <h2 mat-dialog-title style="display: flex; justify-content: space-between; align-items: center; margin: 0; font-family: var(--font-display);">
      <span>Task Details</span>
      <span class="read-only-badge" *ngIf="!canEdit" style="font-size: 11px; display: inline-flex; align-items: center;">
        <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">lock</mat-icon>Read Only
      </span>
    </h2>

    <mat-dialog-content style="min-width: 480px; padding-top: 10px;">
      <!-- Read-only notice banner -->
      <div class="readonly-notice" *ngIf="!canEdit && isProjectMember" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(226, 232, 240, 0.08); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">lock</mat-icon>
        <span>You can only edit tasks assigned to you.</span>
      </div>

      <form [formGroup]="taskForm" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Title field -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required [readonly]="!canEdit" />
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" [readonly]="!canEdit"></textarea>
        </mat-form-field>

        <!-- Status & Priority -->
        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" [disabled]="!canEdit">
              <mat-option value="TODO">To Do</mat-option>
              <mat-option value="IN_PROGRESS">In Progress</mat-option>
              <mat-option value="IN_REVIEW">In Review</mat-option>
              <mat-option value="DONE">Done</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority" [disabled]="!canEdit">
              <mat-option value="LOW">Low</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="HIGH">High</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Assignee & Sprint -->
        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Assignee</mat-label>
            <mat-select formControlName="assignedToId" [disabled]="!canReassign">
              <mat-option [value]="null">Unassigned</mat-option>
              <mat-option *ngFor="let m of projectMembers" [value]="m.userId">
                {{ m.userName }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Sprint</mat-label>
            <mat-select formControlName="sprintId" [disabled]="!canEdit">
              <mat-option [value]="null">Backlog (No Sprint)</mat-option>
              <mat-option *ngFor="let s of sprints" [value]="s.id">
                {{ s.name }} ({{ s.status }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Story Points & Due Date -->
        <div style="display: flex; gap: 16px;">
          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Story Points</mat-label>
            <input matInput type="number" formControlName="storyPoints" required [readonly]="!canEdit" />
          </mat-form-field>

          <mat-form-field appearance="outline" style="flex: 1;">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="duePicker" formControlName="dueDate" [readonly]="!canEdit" />
            <mat-datepicker-toggle matSuffix [for]="duePicker" [disabled]="!canEdit"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>

      <!-- Comments Section -->
      <div style="margin-top: 24px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
        <h3 style="font-size: 14px; font-weight: 500; margin-bottom: 12px; color: var(--text-primary);">Comments</h3>
        
        <!-- Add Comment Form -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px;" *ngIf="isProjectMember || isManager">
          <input matInput placeholder="Write a comment..." [(ngModel)]="newCommentText" style="flex: 1; height: 36px; padding: 0 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface); color: var(--text-primary);" />
          <button mat-raised-button color="primary" [disabled]="!newCommentText.trim() || commenting" (click)="addComment()" style="height: 36px;">
            Post
          </button>
        </div>

        <!-- Comments Feed -->
        <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
          <div *ngFor="let comment of comments" style="display: flex; gap: 10px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <app-avatar [name]="comment.authorName" [src]="comment.authorAvatar" size="sm"></app-avatar>
            <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 12px; color: var(--text-secondary);">{{ comment.authorName }}</strong>
                <span style="font-size: 10px; color: var(--text-muted);">{{ comment.createdAt | date:'short' }}</span>
              </div>
              <p style="margin: 4px 0 0; font-size: 12px; color: var(--text-secondary); white-space: pre-line;">{{ comment.content }}</p>
            </div>
          </div>
          <div *ngIf="comments.length === 0" style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 12px 0;">
            No comments yet.
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="gap: 8px;">
      <button mat-button (click)="dialogRef.close(false)">
        {{ canEdit ? 'Cancel' : 'Close' }}
      </button>
      <button mat-raised-button color="warn" *ngIf="canDelete" (click)="deleteTask()">
        <mat-icon style="margin: 0; font-size: 18px; width: 18px; height: 18px;">delete</mat-icon> Delete
      </button>
      <button mat-raised-button color="primary" *ngIf="canEdit" [disabled]="taskForm.invalid || submitting" (click)="onSubmit()">
        <mat-icon style="margin: 0; font-size: 18px; width: 18px; height: 18px;">save</mat-icon> Save changes
      </button>
    </mat-dialog-actions>
  `
})
export class TaskDetailDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private perm = inject(TaskPermissionService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<TaskDetailDialogComponent>);
  
  public data: { task: Task; projectMembers?: ProjectMember[]; sprints?: Sprint[] } = inject(MAT_DIALOG_DATA);

  taskForm!: FormGroup;
  projectMembers: ProjectMember[] = [];
  sprints: Sprint[] = [];
  comments: Comment[] = [];
  newCommentText = '';
  submitting = false;
  commenting = false;

  get canEdit(): boolean {
    return this.perm.canEdit(this.data.task, this.projectMembers);
  }

  get canDelete(): boolean {
    return this.perm.canDelete(this.data.task, this.projectMembers);
  }

  get canReassign(): boolean {
    return this.perm.canReassign();
  }

  get isProjectMember(): boolean {
    const user = this.auth.currentUser();
    return this.projectMembers.some(m => m.userId === user?.id);
  }

  get isManager(): boolean {
    return this.auth.currentUser()?.role === 'MANAGER';
  }

  ngOnInit(): void {
    const task = this.data.task;
    
    this.taskForm = this.fb.group({
      title: [task.title, [Validators.required, Validators.maxLength(255)]],
      description: [task.description || ''],
      status: [task.status, Validators.required],
      priority: [task.priority, Validators.required],
      storyPoints: [task.storyPoints || 0, [Validators.required, Validators.min(0)]],
      assignedToId: [task.assignedToId || null],
      sprintId: [task.sprintId || null],
      dueDate: [task.dueDate ? new Date(task.dueDate) : null]
    });

    if (this.data.projectMembers) {
      this.projectMembers = this.data.projectMembers;
    } else {
      this.projectService.getMembers(task.projectId).subscribe(res => {
        if (res.success) this.projectMembers = res.data;
      });
    }

    if (this.data.sprints) {
      this.sprints = this.data.sprints;
    } else {
      this.projectService.getProjectSprints(task.projectId).subscribe(res => {
        if (res.success) this.sprints = res.data;
      });
    }

    this.loadComments();
  }

  loadComments(): void {
    this.taskService.getComments(this.data.task.id).subscribe((res: any) => {
      if (res.success) {
        this.comments = res.data;
      }
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim()) return;
    this.commenting = true;
    this.taskService.addComment(this.data.task.id, this.newCommentText).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.newCommentText = '';
          this.loadComments();
        }
        this.commenting = false;
      },
      error: () => this.commenting = false
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) return;
    this.submitting = true;

    const val = this.taskForm.value;
    const formatted = {
      ...val,
      projectId: this.data.task.projectId,
      dueDate: val.dueDate ? this.formatDate(val.dueDate) : null
    };

    this.taskService.updateTask(this.data.task.id, formatted).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.submitting = false;
        }
      },
      error: () => this.submitting = false
    });
  }

  deleteTask(): void {
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
        this.taskService.deleteTask(this.data.task.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            }
          }
        });
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
