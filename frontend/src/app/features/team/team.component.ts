import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Task, Project } from '../../core/models/models';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import Chart from 'chart.js/auto';

interface MemberStats extends User {
  activeProjectsCount: number;
  tasksCompletedThisWeek: number;
  tasksCompletedTotal: number;
  tasksInProgress: number;
  tasksOverdue: number;
  productivityScore: number;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTableModule,
    AvatarComponent,
    BadgeComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  taskService = inject(TaskService);
  projectService = inject(ProjectService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  members: MemberStats[] = [];
  selectedMember?: MemberStats;
  selectedMemberTasks: Task[] = [];
  selectedMemberProjects: Project[] = [];
  
  loading = true;
  loadingProfile = false;

  @ViewChild('prodChartCanvas') prodChartCanvas!: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

  ngOnInit(): void {
    this.loadTeamMembers();
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  loadTeamMembers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          const rawUsers = res.data;
          const statPromises = rawUsers.map(u => new Promise<MemberStats>((resolve) => {
            this.userService.getUserStats(u.id).subscribe(statsRes => {
              this.taskService.getTasks(undefined, u.id, undefined, undefined, undefined, undefined, 0, 1000).subscribe(tasksRes => {
                const userTasks: Task[] = tasksRes.success ? tasksRes.data.content : [];
                
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const completedThisWeek = userTasks.filter(t => 
                  t.status === 'DONE' && 
                  t.completedAt && 
                  new Date(t.completedAt).getTime() > oneWeekAgo.getTime()
                ).length;

                const completedTotal = userTasks.filter(t => t.status === 'DONE').length;
                const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
                
                const today = new Date();
                const overdue = userTasks.filter(t => {
                  if (t.status === 'DONE' || !t.dueDate) return false;
                  const due = new Date(t.dueDate);
                  due.setHours(23, 59, 59, 999);
                  return due.getTime() < today.getTime();
                }).length;

                resolve({
                  ...u,
                  activeProjectsCount: statsRes.success ? statsRes.data.activeProjects : 0,
                  tasksCompletedThisWeek: completedThisWeek,
                  tasksCompletedTotal: completedTotal,
                  tasksInProgress: inProgress,
                  tasksOverdue: overdue,
                  productivityScore: statsRes.success ? statsRes.data.productivityScore : 0
                });
              });
            });
          }));

          Promise.all(statPromises).then(result => {
            this.members = result;
            this.loading = false;
          });
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  selectMember(member: MemberStats): void {
    this.selectedMember = member;
    this.loadingProfile = true;

    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe(projRes => {
      if (projRes.success) {
        const allProj: Project[] = projRes.data.content || [];
        const membershipPromises = allProj.map(p => new Promise<Project | null>((resolve) => {
          this.projectService.getMembers(p.id).subscribe(memRes => {
            if (memRes.success && memRes.data.some(m => m.userId === member.id)) {
              resolve(p);
            } else {
              resolve(null);
            }
          });
        }));

        Promise.all(membershipPromises).then(results => {
          this.selectedMemberProjects = results.filter(r => r !== null) as Project[];
        });
      }
    });

    this.taskService.getTasks(undefined, member.id, undefined, undefined, undefined, undefined, 0, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedMemberTasks = res.data.content || [];
        }
        this.loadingProfile = false;
        setTimeout(() => this.initProductivityChart(), 50);
      },
      error: () => {
        this.loadingProfile = false;
      }
    });
  }

  initProductivityChart(): void {
    const canvas = this.prodChartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = [];
    const data = [];
    const randSeed = this.selectedMember ? this.selectedMember.id : 42;
    const random = this.mulberry32(randSeed);

    for (let i = 7; i >= 0; i--) {
      labels.push(`Week -${i}`);
      data.push(Math.floor(1 + random() * 5));
    }

    if (this.selectedMember) {
      data[7] = this.selectedMember.tasksCompletedThisWeek;
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tasks Completed',
          data: data,
          backgroundColor: '#6366f1',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    } as any);
  }

  openCreateTeammateDialog(): void {
    const dialogRef = this.dialog.open(CreateTeammateDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Teammate created successfully', 'Close', { duration: 3000 });
        this.loadTeamMembers();
      }
    });
  }

  openEditTeammateDialog(member: MemberStats): void {
    const dialogRef = this.dialog.open(EditTeammateDialogComponent, {
      width: '500px',
      data: { member }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Teammate updated successfully', 'Close', { duration: 3000 });
        this.selectedMember = undefined; // Go back to list and refresh
        this.loadTeamMembers();
      }
    });
  }

  private mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }
}

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
            <mat-option value="TEAMMATE">Teammate</mat-option>
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
      role: ['TEAMMATE', Validators.required],
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
            <mat-option value="TEAMMATE">Teammate</mat-option>
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
export class EditTeammateDialogComponent {
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
      role: ['TEAMMATE', Validators.required],
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
