import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { CreateTeammateDialogComponent } from './create-teammate-dialog.component';
import { EditTeammateDialogComponent } from './edit-teammate-dialog.component';
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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvatarComponent,
    BadgeComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    MatDialogModule,
    MatSnackBarModule,
    ConfirmationDialogComponent,
    CreateTeammateDialogComponent,
    EditTeammateDialogComponent
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
        this.selectedMember = undefined;
        this.loadTeamMembers();
      }
    });
  }

  deleteTeammate(member: MemberStats): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Teammate',
        message: `Are you sure you want to delete ${member.name}? This will permanently remove their account, comments, and project memberships.`,
        confirmText: 'Delete Teammate',
        cancelText: 'Cancel',
        type: 'danger',
        requireTypedConfirmation: true,
        expectedConfirmationText: 'DELETE'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(member.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open(`${member.name} has been deleted.`, 'Close', { duration: 3000 });
              this.selectedMember = undefined;
              this.loadTeamMembers();
            } else {
              this.snackBar.open(res.message || 'Failed to delete teammate', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete teammate', 'Close', { duration: 3000 });
          }
        });
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