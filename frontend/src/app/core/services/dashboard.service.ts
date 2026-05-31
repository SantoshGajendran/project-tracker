import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardSummary, TeamProductivity, ProjectHealth, BurndownData, ActivityLog } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/summary`);
  }

  getTeamProductivity(): Observable<ApiResponse<TeamProductivity[]>> {
    return this.http.get<ApiResponse<TeamProductivity[]>>(`${this.apiUrl}/team-productivity`);
  }

  getProjectHealth(): Observable<ApiResponse<ProjectHealth[]>> {
    return this.http.get<ApiResponse<ProjectHealth[]>>(`${this.apiUrl}/project-health`);
  }

  getBurndown(sprintId: number): Observable<ApiResponse<BurndownData>> {
    return this.http.get<ApiResponse<BurndownData>>(`${this.apiUrl}/burndown/${sprintId}`);
  }

  getActivityFeed(): Observable<ApiResponse<ActivityLog[]>> {
    return this.http.get<ApiResponse<ActivityLog[]>>(`${this.apiUrl}/activity-feed`);
  }
}
