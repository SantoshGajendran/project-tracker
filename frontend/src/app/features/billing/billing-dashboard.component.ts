import { Component, AfterViewInit, ViewChild, ElementRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BillingService } from '../../core/services/billing.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="billing-viewport">
      <div class="page-header">
        <div>
          <h1 class="page-title">Billing Dashboard</h1>
          <p class="page-subtitle">Track billable hours across projects and tasks</p>
        </div>
      </div>

      <mat-card class="filter-card glass-panel">
        <div class="filter-row">
          <div class="date-range-picker">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" (dateChange)="onDateRangeChange()" />
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            <span class="date-separator">to</span>
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" (dateChange)="onDateRangeChange()" />
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>
          <div class="summary-card" *ngIf="summary">
            <div class="summary-item">
              <span class="summary-label">Total Hours</span>
              <span class="summary-value">{{ summary.totalHours }}h</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Projects</span>
              <span class="summary-value">{{ summary.projectBreakdown?.length || 0 }}</span>
            </div>
          </div>
        </div>
      </mat-card>

      <div class="charts-grid">
        <mat-card class="chart-card glass-panel">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:8px;">calendar_view_week</mat-icon>
              Weekly Hours by Project
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas #weeklyChartCanvas></canvas>
              <div *ngIf="weeklyData.length === 0 && !loading" class="no-data-overlay">No data for selected period</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card glass-panel">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:8px;">calendar_month</mat-icon>
              Monthly Hours by Project
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
              <canvas #monthlyChartCanvas></canvas>
              <div *ngIf="monthlyData.length === 0 && !loading" class="no-data-overlay">No data for selected period</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card glass-panel chart-full-width">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:8px;">trending_up</mat-icon>
              Month-over-Month Hours Variation
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="variation-info" *ngIf="variation">
              <div class="variation-item" [ngClass]="{'trend-up': variation.trend === 'UP', 'trend-down': variation.trend === 'DOWN', 'trend-flat': variation.trend === 'FLAT'}">
                <span class="variation-label">Current Month ({{ variation.currentMonth }})</span>
                <span class="variation-value">{{ variation.currentMonthTotal }}h</span>
              </div>
              <div class="variation-item">
                <span class="variation-label">Previous Month ({{ variation.previousMonth }})</span>
                <span class="variation-value">{{ variation.previousMonthTotal }}h</span>
              </div>
              <div class="variation-item variation-diff" [ngClass]="{'trend-up': variation.trend === 'UP', 'trend-down': variation.trend === 'DOWN', 'trend-flat': variation.trend === 'FLAT'}">
                <span class="variation-label">Change</span>
                <span class="variation-value">
                  <mat-icon *ngIf="variation.trend === 'UP'" style="font-size:20px;vertical-align:middle;">arrow_upward</mat-icon>
                  <mat-icon *ngIf="variation.trend === 'DOWN'" style="font-size:20px;vertical-align:middle;">arrow_downward</mat-icon>
                  <mat-icon *ngIf="variation.trend === 'FLAT'" style="font-size:20px;vertical-align:middle;">remove</mat-icon>
                  {{ variation.variationPercentage >= 0 ? '+' : '' }}{{ variation.variationPercentage }}%
                </span>
              </div>
            </div>
            <div class="chart-container">
              <canvas #variationChartCanvas></canvas>
              <div *ngIf="!variation && !loading" class="no-data-overlay">No variation data available</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="chart-card glass-panel" *ngIf="summary?.projectBreakdown?.length">
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:8px;">pie_chart</mat-icon>
            Project-wise Hours Breakdown
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Hours</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of summary.projectBreakdown">
                <td>{{ item.projectName }}</td>
                <td class="hours-col">{{ item.hours }}h</td>
                <td>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" [style.width.%]="(item.hours / summary.totalHours) * 100"></div>
                  </div>
                  <span class="pct-text">{{ ((item.hours / summary.totalHours) * 100).toFixed(1) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .billing-viewport { width: 100%; animation: fadeIn 0.3s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-family: var(--font-display); font-style: italic; font-size: 42px; font-weight: 400; line-height: 1.1; color: var(--text-primary); letter-spacing: -0.5px; margin: 0; }
    .page-subtitle { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
    .filter-card { padding: 16px 24px; margin-bottom: 24px; background: var(--bg-surface) !important; border: 1px solid var(--border-subtle) !important; border-radius: 12px !important; }
    .filter-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .date-range-picker { display: flex; align-items: center; gap: 8px; }
    .date-field { width: 160px; }
    .date-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    .date-separator { color: var(--text-muted); font-size: 14px; }
    .summary-card { display: flex; gap: 24px; }
    .summary-item { display: flex; flex-direction: column; align-items: center; }
    .summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); font-family: var(--font-mono); }
    .summary-value { font-size: 24px; font-weight: 700; color: #1976D2; font-family: var(--font-display); }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .chart-card { padding: 20px; background: var(--bg-surface) !important; border: 1px solid var(--border-subtle) !important; border-radius: 12px !important; }
    .chart-full-width { grid-column: 1 / -1; }
    .chart-container { height: 300px; position: relative; margin-top: 16px; }
    .no-data-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; }
    .variation-info { display: flex; gap: 32px; margin-bottom: 16px; padding: 12px 16px; background: var(--bg-elevated); border-radius: 8px; }
    .variation-item { display: flex; flex-direction: column; gap: 4px; }
    .variation-label { font-size: 12px; color: var(--text-muted); }
    .variation-value { font-size: 20px; font-weight: 700; }
    .variation-diff { border-left: 1px solid var(--border-subtle); padding-left: 24px; }
    .trend-up .variation-value { color: #2E7D32; }
    .trend-down .variation-value { color: #C62828; }
    .trend-flat .variation-value { color: #757575; }
    .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .breakdown-table th { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
    .breakdown-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 13.5px; color: var(--text-secondary); }
    .hours-col { font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); }
    .progress-bar-bg { display: inline-block; width: 120px; height: 8px; background: var(--bg-elevated); border-radius: 4px; vertical-align: middle; margin-right: 8px; }
    .progress-bar-fill { height: 100%; background: #1976D2; border-radius: 4px; transition: width 0.3s ease; }
    .pct-text { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
  `]
})
export class BillingDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('weeklyChartCanvas') weeklyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChartCanvas') monthlyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('variationChartCanvas') variationCanvas!: ElementRef<HTMLCanvasElement>;

  billingService = inject(BillingService);

  startDate: Date = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1);
  endDate: Date = new Date();

  private weeklyChart: Chart | null = null;
  private monthlyChart: Chart | null = null;
  private variationChart: Chart | null = null;

  weeklyData: any[] = [];
  monthlyData: any[] = [];
  variation: any = null;
  summary: any = null;
  loading = true;
  private viewInitialized = false;

  private readonly PROJECT_COLORS = [
    '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0',
    '#00BCD4', '#FF5722', '#607D8B', '#CDDC39', '#795548',
    '#3F51B5', '#F44336', '#009688', '#FFC107', '#673AB7',
    '#8BC34A', '#03A9F4', '#FF5252', '#7C4DFF', '#448AFF'
  ];

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  onDateRangeChange(): void {
    if (this.viewInitialized) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.destroyAllCharts();
    this.weeklyData = [];
    this.monthlyData = [];
    this.variation = null;
    this.summary = null;

    const start = this.formatDate(this.startDate);
    const end = this.formatDate(this.endDate);

    this.billingService.getWeeklyHours(start, end).subscribe({
      next: (res) => {
        if (res.success) {
          this.weeklyData = res.data || [];
          setTimeout(() => this.renderWeeklyChart(), 50);
        }
      },
      error: () => this.loading = false
    });

    this.billingService.getMonthlyHours(start, end).subscribe({
      next: (res) => {
        if (res.success) {
          this.monthlyData = res.data || [];
          setTimeout(() => this.renderMonthlyChart(), 50);
        }
      },
      error: () => this.loading = false
    });

    this.billingService.getHoursVariation().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.variation = res.data;
          setTimeout(() => this.renderVariationChart(), 50);
        }
      },
      error: () => this.loading = false
    });

    this.billingService.getSummary(start, end).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary = res.data;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private renderWeeklyChart(): void {
    if (!this.weeklyCanvas?.nativeElement || this.weeklyData.length === 0) return;
    const ctx = this.weeklyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.weeklyData.map((d: any) => {
      const date = new Date(d.weekStart + 'T00:00:00');
      return isNaN(date.getTime()) ? d.weekStart : `W${this.getWeekNumber(date)}`;
    });

    const projectNames = this.extractAllProjectNames(this.weeklyData);
    const datasets = this.buildStackedDatasets(projectNames, this.weeklyData);

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' }, grid: { color: 'rgba(0,0,0,0.06)' } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y}h` } }
        }
      }
    });
  }

  private renderMonthlyChart(): void {
    if (!this.monthlyCanvas?.nativeElement || this.monthlyData.length === 0) return;
    const ctx = this.monthlyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.monthlyData.map((d: any) => d.month);
    const projectNames = this.extractAllProjectNames(this.monthlyData);
    const datasets = this.buildStackedDatasets(projectNames, this.monthlyData);

    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' }, grid: { color: 'rgba(0,0,0,0.06)' } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y}h` } }
        }
      }
    });
  }

  private renderVariationChart(): void {
    if (!this.variationCanvas?.nativeElement || !this.variation) return;
    const ctx = this.variationCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const projectNames = Object.keys(this.variation.projectVariations || {});
    if (projectNames.length === 0) return;

    const prevMonthData = projectNames.map(p => this.variation.projectVariations[p].previousMonthHours);
    const currMonthData = projectNames.map(p => this.variation.projectVariations[p].currentMonthHours);

    this.variationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projectNames,
        datasets: [
          {
            label: `Prev Month (${this.variation.previousMonth})`,
            data: prevMonthData,
            backgroundColor: '#BDBDBD',
            borderRadius: 4
          },
          {
            label: `Curr Month (${this.variation.currentMonth})`,
            data: currMonthData,
            backgroundColor: '#4CAF50',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, title: { display: true, text: 'Hours' }, grid: { color: 'rgba(0,0,0,0.06)' } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.y}h` } }
        }
      }
    });
  }

  private extractAllProjectNames(data: any[]): string[] {
    const names = new Set<string>();
    for (const entry of data) {
      if (entry.projectHours) {
        Object.keys(entry.projectHours).forEach(p => names.add(p));
      }
    }
    return Array.from(names);
  }

  private buildStackedDatasets(projectNames: string[], data: any[]): any[] {
    return projectNames.map((project, index) => ({
      label: project,
      data: data.map((entry: any) => entry.projectHours?.[project] || 0),
      backgroundColor: this.PROJECT_COLORS[index % this.PROJECT_COLORS.length],
      borderRadius: 2
    }));
  }

  private destroyAllCharts(): void {
    [this.weeklyChart, this.monthlyChart, this.variationChart].forEach(chart => {
      if (chart) { chart.destroy(); }
    });
    this.weeklyChart = null;
    this.monthlyChart = null;
    this.variationChart = null;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}