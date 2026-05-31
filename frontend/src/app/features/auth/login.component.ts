import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="login-container">
      <div class="showcase-panel">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="showcase-header">
          <div class="app-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="app-name">ProjectTracker</span>
          </div>
        </div>
        <div class="showcase-content">
          <div class="slide-container">
            @for (slide of slides; track $index) {
              <div class="slide" [class.active]="$index === activeSlideIndex">
                <div class="feature-icon">
                  <mat-icon>{{ slide.icon }}</mat-icon>
                </div>
                <h1 class="slide-title">{{ slide.title }}</h1>
                <p class="slide-desc">{{ slide.description }}</p>
              </div>
            }
          </div>
          <div class="slide-dots">
            @for (slide of slides; track $index) {
              <span class="dot" [class.active]="$index === activeSlideIndex" (click)="setSlide($index)"></span>
            }
          </div>
        </div>
        <div class="showcase-footer">
          <p>© 2026 ProjectTracker. All rights reserved.</p>
        </div>
      </div>
      <div class="login-panel">
        <div class="glass-login-card animate-fade-in">
          <div class="login-header">
            <h2>Welcome back</h2>
            <p>Enter your credentials to access your workspace</p>
          </div>
          <form (submit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required placeholder="pm@projecttracker.com" />
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" name="password" [(ngModel)]="password" required />
              <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
            <button mat-flat-button color="primary" class="submit-btn" [disabled]="loading">
              @if (loading) {
                <span class="spinner-container">
                  <span class="dot-loader"></span>
                  Signing in...
                </span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </form>
          <div class="credentials-tip">
            <p class="tip-title">
              <mat-icon>info_outline</mat-icon>
              <span>Demo Accounts</span>
            </p>
            <div class="demo-pills-grid">
              <div class="demo-pill" (click)="fillCreds('pm@projecttracker.com')">
                <div class="pill-role">
                  <mat-icon>supervisor_account</mat-icon>
                  <span>Project Manager</span>
                </div>
                <div class="pill-email">pm&#64;projecttracker.com</div>
              </div>
              <div class="demo-pill" (click)="fillCreds('john@projecttracker.com')">
                <div class="pill-role">
                  <mat-icon>person</mat-icon>
                  <span>Team Member</span>
                </div>
                <div class="pill-email">john&#64;projecttracker.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .login-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      background-color: var(--bg-main);
      overflow: hidden;
    }
    .showcase-panel {
      flex: 1.3;
      position: relative;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px;
      overflow: hidden;
      color: white;
      z-index: 1;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.35;
      animation: float 25s infinite alternate ease-in-out;
      z-index: -1;
    }
    .orb-1 {
      width: 400px;
      height: 400px;
      background: var(--primary-color);
      top: -100px;
      left: -100px;
    }
    .orb-2 {
      width: 500px;
      height: 500px;
      background: #8b5cf6;
      bottom: -150px;
      right: -100px;
      animation-delay: -5s;
    }
    .orb-3 {
      width: 300px;
      height: 300px;
      background: #06b6d4;
      top: 50%;
      left: 20%;
      animation-delay: -10s;
    }
    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(60px, -80px) scale(1.15); }
      100% { transform: translate(-30px, 40px) scale(0.9); }
    }
    .app-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .app-logo svg {
      width: 36px;
      height: 36px;
      color: var(--primary-light);
    }
    .app-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .showcase-content {
      position: relative;
      max-width: 500px;
      margin: auto 0;
    }
    .slide-container {
      position: relative;
      height: 220px;
      overflow: hidden;
    }
    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
    }
    .slide.active {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .feature-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-light);
    }
    .feature-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .slide-title {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
      background: linear-gradient(to right, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .slide-desc {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
    }
    .slide-dots {
      display: flex;
      gap: 8px;
      margin-top: 24px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .dot.active {
      width: 24px;
      border-radius: 4px;
      background: var(--primary-light);
    }
    .showcase-footer {
      font-size: 13px;
      color: #64748b;
    }
    .login-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background-color: var(--bg-main);
      overflow-y: auto;
    }
    .glass-login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      box-shadow: var(--shadow-card);
      transition: all 0.3s ease;
    }
    .login-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .login-header h2 {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-main);
    }
    .login-header p {
      font-size: 14px;
      color: var(--text-muted);
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-field {
      width: 100%;
    }
    .submit-btn {
      height: 48px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.1px;
      background: var(--primary-color) !important;
      color: white !important;
      transition: all 0.2s ease;
    }
    .submit-btn:hover:not([disabled]) {
      background: var(--primary-dark) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }
    .submit-btn[disabled] {
      opacity: 0.7;
    }
    .spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .dot-loader {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: white;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 1; }
    }
    .credentials-tip {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background-color: var(--track-color);
      border-radius: 14px;
      border: 1px solid var(--border-color);
    }
    .tip-title {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-main);
      font-weight: 600;
      font-size: 13px;
    }
    .tip-title mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary-color);
    }
    .demo-pills-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-pill {
      cursor: pointer;
      padding: 10px 12px;
      background-color: var(--bg-card);
      border-radius: 10px;
      border: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }
    .demo-pill:hover {
      border-color: var(--primary-color);
      background-color: rgba(99, 102, 241, 0.04);
      transform: translateX(2px);
    }
    .pill-role {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 12.5px;
      color: var(--text-main);
    }
    .pill-role mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary-color);
    }
    .pill-email {
      font-size: 11.5px;
      color: var(--text-muted);
      font-family: monospace;
    }
    @media (max-width: 1024px) {
      .showcase-panel {
        display: none;
      }
      .login-panel {
        flex: 1;
        padding: 24px;
      }
      .glass-login-card {
        padding: 32px 24px;
      }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  email = '';
  password = '';
  hidePassword = true;
  loading = false;

  activeSlideIndex = 0;
  private slideInterval: any;

  slides = [
    {
      icon: 'dashboard',
      title: 'Streamline Your Projects',
      description: 'Track velocity, sprints, and task metrics dynamically in one place.'
    },
    {
      icon: 'sync',
      title: 'Interactive Kanban Boards',
      description: 'Drag and drop cards, manage tasks in real-time, and balance workloads.'
    },
    {
      icon: 'groups',
      title: 'Unified Team Management',
      description: 'Collaborate with your team, assign roles, and view developer progress.'
    }
  ];

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startCarousel(): void {
    this.slideInterval = setInterval(() => {
      this.activeSlideIndex = (this.activeSlideIndex + 1) % this.slides.length;
    }, 5000);
  }

  setSlide(index: number): void {
    this.activeSlideIndex = index;
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.startCarousel();
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/']);
        } else {
          this.snackBar.open(res.message as string || 'Login failed', 'Close', { duration: 3000 });
        }
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Invalid email or password', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  fillCreds(email: string): void {
    this.email = email;
    this.password = 'password';
  }
}

