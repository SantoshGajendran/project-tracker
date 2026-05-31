import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProjectService } from '../../core/services/project.service';
import { Sprint, BurndownData, Project } from '../../core/models/models';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-sprints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    EmptyStateComponent
  ],
  templateUrl: './sprints.component.html',
  styleUrls: ['./sprints.component.css']
})
export class SprintsComponent implements OnInit, OnDestroy {
  dashboardService = inject(DashboardService);
  projectService = inject(ProjectService);
  route = inject(ActivatedRoute);

  projects: Project[] = [];
  sprints: Sprint[] = [];
  selectedSprintId?: number;
  burndownData?: BurndownData;

  loading = true;
  loadingBurndown = false;

  @ViewChild('burnCanvas') burnCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('velocityCanvas') velocityCanvas!: ElementRef<HTMLCanvasElement>;

  burnChart?: Chart;
  velocityChart?: Chart;

  private themeObserver?: MutationObserver;

  get selectedSprint(): Sprint | undefined {
    return this.sprints.find(s => s.id === this.selectedSprintId);
  }

  ngOnInit(): void {
    this.setupThemeObserver();
    this.route.queryParams.subscribe(params => {
      if (params['sprintId']) {
        this.selectedSprintId = Number(params['sprintId']);
      }
      this.loadProjectsAndSprints();
    });
  }

  ngOnDestroy(): void {
    if (this.burnChart) this.burnChart.destroy();
    if (this.velocityChart) this.velocityChart.destroy();
    if (this.themeObserver) this.themeObserver.disconnect();
  }

  setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => {
      if (this.burndownData) this.initBurndownChart();
      this.initVelocityChart();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['theme']
    });
  }

  isDark(): boolean {
    return document.documentElement.getAttribute('theme') === 'dark';
  }

  getChartTheme() {
    const dark = this.isDark();
    return {
      gridColor:       dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
      textColor:       dark ? '#8892A4'                : '#52525B',
      idealColor:      dark ? 'rgba(74, 85, 104, 0.7)' : 'rgba(148, 163, 184, 0.9)',
      actualLineColor: dark ? '#63B3ED'                : '#2563EB',
      barColor:        dark ? '#68D391'                : '#16A34A',
      fontFamily:      'DM Sans, sans-serif',
      bg:              dark ? '#131720'                : '#FFFFFF',
    };
  }

  loadProjectsAndSprints(): void {
    this.loading = true;
    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe(resProj => {
      if (resProj.success) {
        this.projects = resProj.data.content || [];

        const activeProjIds = this.projects
          .filter(p => p.status === 'IN_PROGRESS' || p.status === 'PLANNING')
          .map(p => p.id);

        const sprintPromises = activeProjIds.map(id => new Promise<Sprint[]>((resolve) => {
          this.projectService.getProjectSprints(id).subscribe(res => {
            resolve(res.success ? res.data : []);
          });
        }));

        Promise.all(sprintPromises).then(results => {
          this.sprints = results.flat();
          if (this.sprints.length > 0) {
            if (!this.selectedSprintId) {
              const active = this.sprints.find(s => s.status === 'ACTIVE');
              this.selectedSprintId = active ? active.id : this.sprints[0].id;
            }
            this.loadBurndownChart();
          } else {
            this.loading = false;
            setTimeout(() => this.initVelocityChart(), 50);
          }
        });
      } else {
        this.loading = false;
      }
    });
  }

  loadBurndownChart(): void {
    if (!this.selectedSprintId) return;
    this.loadingBurndown = true;

    this.dashboardService.getBurndown(this.selectedSprintId).subscribe({
      next: (res) => {
        if (res.success) {
          this.burndownData = res.data;
          setTimeout(() => {
            this.initBurndownChart();
            this.initVelocityChart();
          }, 50);
        }
        this.loadingBurndown = false;
        this.loading = false;
      },
      error: () => {
        this.loadingBurndown = false;
        this.loading = false;
      }
    });
  }

  onSprintChange(sprintId: number): void {
    this.selectedSprintId = sprintId;
    this.loadBurndownChart();
  }

  // ── Progress helpers ──
  getBurndownPct(): number {
    if (!this.burndownData) return 0;
    const start = new Date(this.burndownData.startDate).getTime();
    const end   = new Date(this.burndownData.endDate).getTime();
    const now   = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  }

  getProgressOffset(): number {
    // circumference = 2 * π * 14 ≈ 87.96 → use 88
    return 88 - (88 * this.getBurndownPct()) / 100;
  }

  getAvgVelocity(): number {
    return 37; // placeholder — replace with real aggregated data
  }

  getBurndownStatus(): string {
    if (!this.burndownData) return '';
    const pts = this.burndownData.dataPoints;
    if (!pts || pts.length === 0) return '';
    const last = pts[pts.length - 1];
    if (last.actualRemaining === undefined || last.actualRemaining === null) return '';
    const diff = last.actualRemaining - last.idealRemaining;
    if (Math.abs(diff) <= 2) return 'on-track';
    return diff > 0 ? 'behind' : 'ahead';
  }

  getBurndownStatusIcon(): string {
    const s = this.getBurndownStatus();
    if (s === 'on-track') return 'check_circle';
    if (s === 'behind')   return 'warning';
    if (s === 'ahead')    return 'rocket_launch';
    return 'info';
  }

  getBurndownStatusLabel(): string {
    const s = this.getBurndownStatus();
    if (s === 'on-track') return 'On Track';
    if (s === 'behind')   return 'Behind Schedule';
    if (s === 'ahead')    return 'Ahead of Schedule';
    return 'Tracking';
  }

  // ── Burndown chart ──
  initBurndownChart(): void {
    const canvas = this.burnCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.burnChart) this.burnChart.destroy();
    if (!this.burndownData) return;

    const dark = this.isDark();
    const theme = this.getChartTheme();

    // Glowing gradient under actual line
    const actualGradient = ctx.createLinearGradient(0, 0, 0, 320);
    if (dark) {
      actualGradient.addColorStop(0,   'rgba(99, 179, 237, 0.28)');
      actualGradient.addColorStop(0.5, 'rgba(99, 179, 237, 0.08)');
      actualGradient.addColorStop(1,   'rgba(99, 179, 237, 0.00)');
    } else {
      actualGradient.addColorStop(0,   'rgba(37, 99, 235, 0.18)');
      actualGradient.addColorStop(0.6, 'rgba(37, 99, 235, 0.05)');
      actualGradient.addColorStop(1,   'rgba(37, 99, 235, 0.00)');
    }

    const labels      = this.burndownData.dataPoints.map(p => p.date);
    const idealData   = this.burndownData.dataPoints.map(p => p.idealRemaining);
    const actualData  = this.burndownData.dataPoints.map(p =>
      p.actualRemaining !== undefined ? p.actualRemaining : null
    );

    this.burnChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ideal Burndown',
            data: idealData,
            borderColor: dark ? 'rgba(74,85,104,0.7)' : 'rgba(148,163,184,0.9)',
            borderWidth: 1.5,
            borderDash: [6, 4],
            fill: false,
            tension: 0,
            pointRadius: 0
          },
          {
            label: 'Actual Remaining',
            data: actualData,
            borderColor: dark ? '#63B3ED' : '#2563EB',
            borderWidth: 2.5,
            backgroundColor: actualGradient,
            fill: true,
            tension: 0.25,
            pointBackgroundColor: dark ? '#63B3ED' : '#2563EB',
            pointBorderColor: dark ? '#131720' : '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: dark ? '#90CDF4' : '#1D4ED8',
            pointHoverBorderColor: dark ? '#131720' : '#fff',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: dark ? '#1A2030' : '#ffffff',
            borderColor:     dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor:  dark ? '#F0F4FF' : '#09090B',
            bodyColor:   dark ? '#8892A4' : '#52525B',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} items`
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Remaining Work Items',
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 11, weight: 500 }
            },
            grid: { color: theme.gridColor },
            border: { color: 'transparent' },
            ticks: {
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 11 },
              maxTicksLimit: 6
            },
            beginAtZero: true
          },
          x: {
            title: {
              display: true,
              text: 'Sprint Days',
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 11, weight: 500 }
            },
            grid: { color: 'transparent' },
            border: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 10 },
              maxTicksLimit: 8
            }
          }
        }
      }
    });
  }

  // ── Velocity chart ──
  initVelocityChart(): void {
    const canvas = this.velocityCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.velocityChart) this.velocityChart.destroy();

    const dark = this.isDark();
    const theme = this.getChartTheme();

    // Green glow gradient for bars
    const barGradient = ctx.createLinearGradient(0, 0, 0, 260);
    if (dark) {
      barGradient.addColorStop(0,   'rgba(104, 211, 145, 0.90)');
      barGradient.addColorStop(0.6, 'rgba(104, 211, 145, 0.40)');
      barGradient.addColorStop(1,   'rgba(104, 211, 145, 0.10)');
    } else {
      barGradient.addColorStop(0,   'rgba(22, 163, 74, 0.85)');
      barGradient.addColorStop(0.6, 'rgba(22, 163, 74, 0.45)');
      barGradient.addColorStop(1,   'rgba(22, 163, 74, 0.10)');
    }

    const sprintNames = ['Sprint 10', 'Sprint 11', 'Sprint 12', 'Sprint 13', 'Sprint 14 (Active)'];
    const velocityData = [34, 42, 38, 45, 28];

    this.velocityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sprintNames,
        datasets: [{
          label: 'Completed Items',
          data: velocityData,
          backgroundColor: barGradient,
          borderColor: dark ? 'rgba(104, 211, 145, 0.7)' : 'rgba(22, 163, 74, 0.7)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: dark ? 'rgba(104, 211, 145, 0.95)' : 'rgba(22, 163, 74, 0.95)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: dark ? '#1A2030' : '#ffffff',
            borderColor:     dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor:  dark ? '#F0F4FF' : '#09090B',
            bodyColor:   dark ? '#8892A4' : '#52525B',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` Completed: ${ctx.parsed.y} items`
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Completed Work Items',
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 11, weight: 500 }
            },
            grid: { color: theme.gridColor },
            border: { color: 'transparent' },
            ticks: {
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 11 },
              maxTicksLimit: 5
            },
            beginAtZero: true
          },
          x: {
            grid: { display: false },
            border: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: theme.fontFamily, size: 10 }
            }
          }
        }
      }
    });
  }
}
