import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Task, Comment } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(projectId?: number, assigneeId?: number, status?: string, priority?: string, sprintId?: number, search?: string, page: number = 0, size: number = 10): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (projectId) params = params.set('projectId', projectId.toString());
    if (assigneeId) params = params.set('assigneeId', assigneeId.toString());
    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (sprintId) params = params.set('sprintId', sprintId.toString());
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  createTask(task: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, task);
  }

  getTaskById(id: number): Observable<ApiResponse<Task>> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`);
  }

  updateTask(id: number, task: Partial<Task>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  patchStatus(id: number, status: string): Observable<ApiResponse<Task>> {
    let params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  patchAssignee(id: number, assigneeId?: number): Observable<ApiResponse<Task>> {
    let params = new HttpParams();
    if (assigneeId) {
      params = params.set('assigneeId', assigneeId.toString());
    }
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/${id}/assign`, null, { params });
  }

  getMyTasks(): Observable<ApiResponse<Task[]>> {
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/my-tasks`);
  }

  getOverdueTasks(): Observable<ApiResponse<Task[]>> {
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/overdue`);
  }

  addComment(taskId: number, content: string): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${this.apiUrl}/${taskId}/comments`, { content });
  }

  getComments(taskId: number): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/${taskId}/comments`);
  }
}
