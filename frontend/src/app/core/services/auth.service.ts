import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signals for application state
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);
  isManager = computed(() => this.currentUser()?.role === 'MANAGER');
  isManagerOrLead = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD';
  });

  constructor(private http: HttpClient, private router: Router) {
    this.loadTokenAndFetchUser();
  }

  login(credentials: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data.token) {
          sessionStorage.setItem('token', res.data.token);
          this.currentUser.set(res.data.user);
        }
      })
    );
  }

  register(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User | null> {
    const token = sessionStorage.getItem('token');
    if (!token) {
      return of(null);
    }
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      map(res => {
        if (res.success) {
          this.currentUser.set(res.data);
          return res.data;
        }
        this.logout();
        return null;
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private loadTokenAndFetchUser(): void {
    this.getCurrentUser().subscribe();
  }

  setToken(token: string): void {
    sessionStorage.setItem('token', token);
    this.loadTokenAndFetchUser();
  }

  loginWithGoogle(): void {
    const redirectUri = encodeURIComponent(`${window.location.origin}/oauth2/redirect`);
    const backendUrl = environment.apiUrl.replace('/api', '');
    window.location.href = `${backendUrl}/oauth2/authorize/google?redirect_uri=${redirectUri}`;
  }

  loginWithGithub(): void {
    const redirectUri = encodeURIComponent(`${window.location.origin}/oauth2/redirect`);
    const backendUrl = environment.apiUrl.replace('/api', '');
    window.location.href = `${backendUrl}/oauth2/authorize/github?redirect_uri=${redirectUri}`;
  }
}
