import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/time-entries`;

  getTimeEntries(projectId?: number, taskId?: number, userId?: number, startDate?: string, endDate?: string, page: number = 0, size: number = 20): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (projectId) params = params.set('projectId', projectId.toString());
    if (taskId) params = params.set('taskId', taskId.toString());
    if (userId) params = params.set('userId', userId.toString());
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getTotalHoursForTask(taskId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/tasks/${taskId}/total-hours`);
  }

  createTimeEntry(entry: { projectId: number; taskId: number; hours: number; description?: string; loggedDate: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, entry);
  }

  updateTimeEntry(id: number, entry: { projectId: number; taskId: number; hours: number; description?: string; loggedDate: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, entry);
  }

  deleteTimeEntry(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}