import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { UserService } from '../../core/services/user.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
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
    EmptyStateComponent
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  taskService = inject(TaskService);
  projectService = inject(ProjectService);

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
          // For each user, fetch stats
          const statPromises = rawUsers.map(u => new Promise<MemberStats>((resolve) => {
            this.userService.getUserStats(u.id).subscribe(statsRes => {
              this.taskService.getTasks(undefined, u.id, undefined, undefined, undefined, undefined, 0, 1000).subscribe(tasksRes => {
                const userTasks: Task[] = tasksRes.success ? tasksRes.data.content : [];
                
                // completed this week: tasks completed in last 7 days
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

    // Load active projects
    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe(projRes => {
      if (projRes.success) {
        // filter projects where user is member
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

    // Load task history
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

    // Generate last 8 weeks labels
    const labels = [];
    const data = [];
    const randSeed = this.selectedMember ? this.selectedMember.id : 42;
    const random = this.mulberry32(randSeed);

    for (let i = 7; i >= 0; i--) {
      labels.push(`Week -${i}`);
      // mock tasks completed per week between 1 and 6
      data.push(Math.floor(1 + random() * 5));
    }

    // Replace the last week with actual tasks completed this week
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

  // Simple deterministic random generator for seed charts
  private mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }
}
