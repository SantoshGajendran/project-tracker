import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Project, ProjectDetail, ProjectMember, Task, Sprint, ActivityLog } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getProjects(status?: string, priority?: string, search?: string, page: number = 0, size: number = 10, sort: string = 'name,asc'): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  createProject(project: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, project);
  }

  getProjectDetails(id: number): Observable<ApiResponse<ProjectDetail>> {
    return this.http.get<ApiResponse<ProjectDetail>>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: number, project: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getMembers(projectId: number): Observable<ApiResponse<ProjectMember[]>> {
    return this.http.get<ApiResponse<ProjectMember[]>>(`${this.apiUrl}/${projectId}/members`);
  }

  assignMember(projectId: number, memberDto: { userId: number; role: string }): Observable<ApiResponse<ProjectMember>> {
    return this.http.post<ApiResponse<ProjectMember>>(`${this.apiUrl}/${projectId}/members`, {
      ...memberDto,
      projectId
    });
  }

  removeMember(projectId: number, userId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${projectId}/members/${userId}`);
  }

  getProjectTasks(projectId: number, status?: string, priority?: string, sprintId?: number, search?: string, page: number = 0, size: number = 100): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (sprintId) params = params.set('sprintId', sprintId.toString());
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${projectId}/tasks`, { params });
  }

  getProjectSprints(projectId: number): Observable<ApiResponse<Sprint[]>> {
    return this.http.get<ApiResponse<Sprint[]>>(`${this.apiUrl}/${projectId}/sprints`);
  }

  getProjectActivity(projectId: number, page: number = 0, size: number = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${projectId}/activity`, { params });
  }
}
