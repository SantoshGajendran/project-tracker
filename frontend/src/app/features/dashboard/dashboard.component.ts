import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../core/services/dashboard.service';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary, ProjectHealth, ActivityLog, Task } from '../../core/models/models';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    BadgeComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    AvatarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadCanvas') workloadCanvas!: ElementRef<HTMLCanvasElement>;

  authService = inject(AuthService);
  todayDate = new Date();

  summary?: DashboardSummary;
  health: ProjectHealth[] = [];
  activities: ActivityLog[] = [];
  myTasks: Task[] = [];
  
  loading = true;
  pollInterval: any;

  statusChart?: Chart;
  workloadChart?: Chart;

  constructor(
    private dashboardService: DashboardService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadData();
    // Poll data every 30 seconds for real-time activity feed
    this.pollInterval = setInterval(() => {
      this.refreshRealTimeData();
    }, 30000);
  }

  ngAfterViewInit(): void {
    if (!this.loading) {
      this.initCharts();
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.statusChart) this.statusChart.destroy();
    if (this.workloadChart) this.workloadChart.destroy();
  }

  loadData(): void {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = res.data;
          this.dashboardService.getProjectHealth().subscribe({
            next: (resHealth) => {
              if (resHealth.success) {
                this.health = resHealth.data.slice(0, 5); // top 5 health
              }
              this.dashboardService.getActivityFeed().subscribe({
                next: (resFeed) => {
                  if (resFeed.success) {
                    this.activities = resFeed.data;
                  }
                  this.taskService.getMyTasks().subscribe({
                    next: (resTasks) => {
                      if (resTasks.success) {
                        this.myTasks = resTasks.data.slice(0, 5); // limit to 5
                      }
                      this.loading = false;
                      setTimeout(() => this.initCharts(), 50);
                    },
                    error: () => this.loading = false
                  });
                },
                error: () => this.loading = false
              });
            },
            error: () => this.loading = false
          });
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  refreshRealTimeData(): void {
    // Only refresh summary and activities silently in the background
    this.dashboardService.getSummary().subscribe(res => {
      if (res.success) {
        this.summary = res.data;
        this.updateWorkloadChart();
        this.updateStatusChart();
      }
    });
    this.dashboardService.getActivityFeed().subscribe(res => {
      if (res.success) {
        this.activities = res.data;
      }
    });
  }

  initCharts(): void {
    if (!this.summary) return;

    // Donut Chart - Project Status
    const statusCtx = this.statusCanvas?.nativeElement?.getContext('2d');
    if (statusCtx) {
      if (this.statusChart) this.statusChart.destroy();

      const statuses = Object.keys(this.summary.projectsByStatus);
      const counts = Object.values(this.summary.projectsByStatus);

      this.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: statuses.map(s => s.replace('_', ' ')),
          datasets: [{
            data: counts,
            backgroundColor: ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#6b7280'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11, family: 'Inter' }
              }
            }
          }
        }
      } as any);
    }

    // Bar Chart - Workload
    const workloadCtx = this.workloadCanvas?.nativeElement?.getContext('2d');
    if (workloadCtx) {
      if (this.workloadChart) this.workloadChart.destroy();

      const members = Object.keys(this.summary.teamWorkload);
      const taskCounts = Object.values(this.summary.teamWorkload);

      this.workloadChart = new Chart(workloadCtx, {
        type: 'bar',
        data: {
          labels: members,
          datasets: [{
            label: 'Active Tasks',
            data: taskCounts,
            backgroundColor: '#818cf8',
            borderRadius: 6
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
  }

  updateWorkloadChart(): void {
    if (this.workloadChart && this.summary) {
      this.workloadChart.data.labels = Object.keys(this.summary.teamWorkload);
      this.workloadChart.data.datasets[0].data = Object.values(this.summary.teamWorkload) as any;
      this.workloadChart.update();
    }
  }

  updateStatusChart(): void {
    if (this.statusChart && this.summary) {
      this.statusChart.data.labels = Object.keys(this.summary.projectsByStatus).map(s => s.replace('_', ' '));
      this.statusChart.data.datasets[0].data = Object.values(this.summary.projectsByStatus) as any;
      this.statusChart.update();
    }
  }

  getMemberCount(): number {
    return this.summary ? Object.keys(this.summary.teamWorkload).length : 0;
  }
}
