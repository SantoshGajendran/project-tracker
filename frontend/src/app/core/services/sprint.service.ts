import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Sprint, Task } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl = `${environment.apiUrl}/sprints`;

  constructor(private http: HttpClient) {}

  createSprint(sprint: Partial<Sprint>): Observable<ApiResponse<Sprint>> {
    return this.http.post<ApiResponse<Sprint>>(this.apiUrl, sprint);
  }

  updateSprint(id: number, sprint: Partial<Sprint>): Observable<ApiResponse<Sprint>> {
    return this.http.put<ApiResponse<Sprint>>(`${this.apiUrl}/${id}`, sprint);
  }

  startSprint(id: number): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${id}/start`, null);
  }

  completeSprint(id: number): Observable<ApiResponse<Sprint>> {
    return this.http.patch<ApiResponse<Sprint>>(`${this.apiUrl}/${id}/complete`, null);
  }

  getSprintTasks(id: number): Observable<ApiResponse<Task[]>> {
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/${id}/tasks`);
  }
}
