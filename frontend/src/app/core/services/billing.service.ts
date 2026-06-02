import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/billing/dashboard`;

  getWeeklyHours(start: string, end: string): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/weekly-hours`, { params });
  }

  getMonthlyHours(start: string, end: string): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/monthly-hours`, { params });
  }

  getHoursVariation(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/hours-variation`);
  }

  getSummary(start: string, end: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/summary`, { params });
  }
}