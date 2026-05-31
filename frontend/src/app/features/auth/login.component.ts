import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { ParticleService } from '../../core/services/particle.service';
import { loginAnimations } from './login.animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  providers: [ParticleService],
  animations: [loginAnimations],
  template: `
    <div class="login-container">
      <!-- Ambient Brand Panel (Left Split) -->
      <div class="brand-panel" @staggerFade>
        <div class="panel-overlay"></div>
        <div class="glow-orb orb-accent"></div>
        <div class="glow-orb orb-glow"></div>
        <canvas #particleCanvas class="particle-canvas"></canvas>

        <div class="brand-header">
          <div class="logo-wrapper">
            <svg class="brand-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="var(--accent)"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="var(--accent)" fill-opacity="0.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="var(--accent)" fill-opacity="0.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="var(--accent)"/>
            </svg>
            <span class="logo-text">ProjectFlow</span>
          </div>
        </div>

        <div class="brand-body">
          <div class="hero-eyebrow">WORKSPACE PLATFORM</div>
          <h1 class="hero-title">
            Engineering velocity,<br/>
            <em>reimagined</em>.
          </h1>
          <p class="hero-sub">
            A command center for modern engineering teams. Real-time insights, unified project status, and velocity tracking in a singular premium space.
          </p>
        </div>
      </div>

      <!-- Frictionless Login Panel (Right Split) -->
      <div class="form-panel" @fadeUp>
        <div class="form-container">
          <div class="form-header">
            <h2>Welcome back</h2>
            <p class="form-desc">Enter your credentials to access your workspace</p>
          </div>

          <!-- Error Alert -->
          @if (errorMessage) {
            <div class="error-banner" @slideDown>
              <span class="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <span class="error-msg">{{ errorMessage }}</span>
              <button class="close-error" (click)="errorMessage = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Email Field -->
            <div class="field-group">
              <label for="email" class="input-label">Email Address</label>
              <div class="input-wrapper" [class.focused]="focusedFields.has('email')" [class.has-error]="showError('email')">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="pm@projecttracker.com"
                  (focus)="focusedFields.add('email')"
                  (blur)="focusedFields.delete('email')"
                />
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
              </div>
              @if (showError('email')) {
                <div class="validation-message" @slideDown>
                  @if (loginForm.get('email')?.hasError('required')) {
                    <span>Email is required</span>
                  } @else if (loginForm.get('email')?.hasError('email')) {
                    <span>Please enter a valid email address</span>
                  }
                </div>
              }
            </div>

            <!-- Password Field -->
            <div class="field-group">
              <div class="label-row">
                <label for="password" class="input-label">Password</label>
                <a href="javascript:void(0)" class="forgot-link">Forgot?</a>
              </div>
              <div class="input-wrapper" [class.focused]="focusedFields.has('password')" [class.has-error]="showError('password')">
                <input
                  id="password"
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="password"
                  placeholder="••••••••"
                  (focus)="focusedFields.add('password')"
                  (blur)="focusedFields.delete('password')"
                />
                <button type="button" class="password-toggle" (click)="hidePassword = !hidePassword">
                  @if (hidePassword) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  }
                </button>
              </div>
              @if (showError('password')) {
                <div class="validation-message" @slideDown>
                  <span>Password is required</span>
                </div>
              }
            </div>

            <!-- Keep me signed in -->
            <div class="form-actions">
              <label class="checkbox-container">
                <input type="checkbox" checked />
                <span class="checkmark"></span>
                <span class="checkbox-label">Keep me signed in</span>
              </label>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="submit-button" [disabled]="loading || loginForm.invalid">
              @if (loading) {
                <span class="loading-state">
                  <svg class="spinner" viewBox="0 0 24 24">
                    <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
                  </svg>
                  Signing In...
                </span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </form>

          <!-- SSO Providers -->
          <div class="sso-divider">
            <span class="divider-line"></span>
            <span class="divider-text">or continue with</span>
            <span class="divider-line"></span>
          </div>

          <div class="sso-buttons">
            <button type="button" class="sso-btn" (click)="loginWithGoogle()">
              <svg viewBox="0 0 24 24" class="sso-icon">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 14.98 1 12 1 7.35 1 3.37 3.68 1.4 7.6l3.86 3C6.18 7.6 8.87 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z"/>
                <path fill="#FBBC05" d="M5.26 14.4c-.24-.72-.38-1.5-.38-2.4s.14-1.68.38-2.4L1.4 6.6C.5 8.22 0 10.05 0 12s.5 3.78 1.4 5.4l3.86-3z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.11-4.26 1.11-3.13 0-5.82-2.56-6.74-5.56L1.4 15.76C3.37 19.68 7.35 23 12 23z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" class="sso-btn" (click)="loginWithGithub()">
              <svg viewBox="0 0 24 24" class="sso-icon" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <!-- Sandbox Accounts -->
          <div class="demo-section">
            <div class="demo-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Sandbox Environments</span>
            </div>
            <div class="demo-cards">
              <div class="demo-card" (click)="fillCreds('pm@projecttracker.com')">
                <div class="card-lead">
                  <span class="role-badge manager">PM</span>
                  <span class="role-title">Project Manager</span>
                </div>
                <span class="role-email">pm&#64;projecttracker.com</span>
              </div>
              <div class="demo-card" (click)="fillCreds('john@projecttracker.com')">
                <div class="card-lead">
                  <span class="role-badge member">DEV</span>
                  <span class="role-title">Team Member</span>
                </div>
                <span class="role-email">john&#64;projecttracker.com</span>
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
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-void);
    }

    .login-container {
      display: flex;
      width: 100%;
      height: 100%;
    }

    /* ─── LEFT BRAND PANEL ─── */
    .brand-panel {
      flex: 1.25;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: var(--space-xl);
      background-color: var(--bg-base);
      border-right: 1px solid var(--border-subtle);
      overflow: hidden;
      z-index: 1;
    }

    .panel-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 15% 15%, var(--accent-glow) 0%, transparent 60%),
                  radial-gradient(circle at 85% 85%, rgba(99, 179, 237, 0.04) 0%, transparent 60%);
      pointer-events: none;
      z-index: 1;
    }

    .particle-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.18;
      pointer-events: none;
      z-index: 0;
      will-change: transform;
    }

    .orb-accent {
      width: 320px;
      height: 320px;
      background: var(--accent);
      top: 15%;
      left: -60px;
      animation: pulse-slow 22s infinite alternate ease-in-out;
    }

    .orb-glow {
      width: 420px;
      height: 420px;
      background: #7C3AED;
      bottom: 10%;
      right: -80px;
      animation: pulse-slow 28s infinite alternate-reverse ease-in-out;
    }

    @keyframes pulse-slow {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(1.15) translate(40px, -20px); }
    }

    .brand-header {
      position: relative;
      z-index: 2;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .brand-logo {
      width: 28px;
      height: 28px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    .brand-body {
      position: relative;
      max-width: 480px;
      margin-top: auto;
      margin-bottom: auto;
      z-index: 2;
    }

    .hero-eyebrow {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.15em;
      color: var(--text-accent);
      margin-bottom: var(--space-md);
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: 48px;
      font-weight: 400;
      line-height: 1.1;
      color: var(--text-primary);
      margin-bottom: var(--space-md);
      letter-spacing: -0.01em;
    }

    .hero-title em {
      font-style: italic;
      color: var(--text-accent);
    }

    .hero-sub {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-secondary);
      margin-bottom: var(--space-xl);
    }

    .stats-strip {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-val {
      font-family: var(--font-mono);
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .stat-lbl {
      font-size: 11px;
      color: var(--text-muted);
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background-color: var(--border-default);
    }

    .brand-footer {
      position: relative;
      z-index: 2;
    }

    .quote-strip {
      padding: var(--space-md) var(--space-lg);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      max-width: 520px;
    }

    [theme="light"] .quote-strip {
      background: rgba(0, 0, 0, 0.01);
    }

    .quote-text {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: var(--space-md);
    }

    .quote-author {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .author-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-glow);
      border: 1px solid var(--border-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-accent);
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .author-role {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* ─── RIGHT FORM PANEL ─── */
    .form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      background-color: var(--bg-void);
      overflow-y: auto;
      position: relative;
    }

    .form-container {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
    }

    .form-header {
      margin-bottom: var(--space-xl);
    }

    .form-header h2 {
      font-size: 28px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .form-desc {
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* ─── ERROR ALERTS ─── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.2);
      border-radius: var(--radius-md);
      color: var(--status-danger);
      font-size: 13.5px;
      margin-bottom: var(--space-lg);
    }

    [theme="dark"] .error-banner {
      background: rgba(252, 129, 129, 0.06);
      border-color: rgba(252, 129, 129, 0.15);
      color: var(--status-danger);
    }

    .error-icon svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .error-msg {
      flex: 1;
    }

    .close-error {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity var(--duration-fast);
    }

    .close-error:hover {
      opacity: 1;
    }

    .close-error svg {
      width: 14px;
      height: 14px;
    }

    /* ─── FORM CONTROLS ─── */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .input-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .forgot-link {
      font-size: 12.5px;
      color: var(--text-accent);
      text-decoration: none;
      transition: opacity var(--duration-fast);
    }

    .forgot-link:hover {
      opacity: 0.85;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 44px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 0 var(--space-md);
      transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
    }

    .input-wrapper:hover {
      border-color: var(--border-strong);
    }

    .input-wrapper.focused {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .input-wrapper.has-error {
      border-color: var(--status-danger);
    }

    .input-wrapper input {
      flex: 1;
      height: 100%;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--text-primary);
      padding: 0;
    }

    .input-wrapper input::placeholder {
      color: var(--text-muted);
    }

    .input-icon {
      display: flex;
      align-items: center;
      color: var(--text-muted);
      margin-left: var(--space-sm);
    }

    .input-icon svg {
      width: 16px;
      height: 16px;
    }

    .password-toggle {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      transition: color var(--duration-fast);
      margin-left: var(--space-sm);
    }

    .password-toggle:hover {
      color: var(--text-primary);
    }

    .password-toggle svg {
      width: 16px;
      height: 16px;
    }

    .validation-message {
      font-size: 12px;
      color: var(--status-danger);
      margin-top: 2px;
    }

    /* checkbox */
    .form-actions {
      display: flex;
      align-items: center;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      user-select: none;
      gap: var(--space-sm);
    }

    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      width: 16px;
      height: 16px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--duration-fast), border-color var(--duration-fast);
    }

    .checkbox-container:hover input ~ .checkmark {
      border-color: var(--border-strong);
    }

    .checkbox-container input:checked ~ .checkmark {
      background-color: var(--accent);
      border-color: var(--accent);
    }

    .checkmark::after {
      content: "";
      display: none;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 1.5px 1.5px 0;
      transform: rotate(45deg) translate(-1px, -1px);
    }

    .checkbox-container input:checked ~ .checkmark::after {
      display: block;
    }

    .checkbox-label {
      font-size: 13px;
      color: var(--text-secondary);
    }

    /* Submit button */
    .submit-button {
      width: 100%;
      height: 44px;
      background: var(--accent);
      color: var(--bg-surface);
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      font-size: 14.5px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity var(--duration-fast), transform var(--duration-fast);
    }

    .submit-button:hover:not([disabled]) {
      opacity: 0.92;
    }

    .submit-button:active:not([disabled]) {
      transform: scale(0.98);
    }

    .submit-button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      animation: rotate 1.8s linear infinite;
      width: 16px;
      height: 16px;
    }

    .spinner .path {
      stroke: currentColor;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }

    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }

    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }

    /* ─── SSO OPTIONS ─── */
    .sso-divider {
      display: flex;
      align-items: center;
      margin: var(--space-xl) 0 var(--space-lg);
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background-color: var(--border-subtle);
    }

    .divider-text {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0 var(--space-md);
    }

    .sso-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .sso-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      height: 40px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color var(--duration-fast), border-color var(--duration-fast), color var(--duration-fast);
    }

    .sso-btn:hover {
      background: var(--bg-elevated);
      border-color: var(--border-strong);
      color: var(--text-primary);
    }

    .sso-icon {
      width: 16px;
      height: 16px;
    }

    /* ─── SANDBOX ENVIRONMENTS ─── */
    .demo-section {
      border-top: 1px dashed var(--border-default);
      padding-top: var(--space-xl);
    }

    .demo-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: var(--space-md);
    }

    .info-icon {
      width: 14px;
      height: 14px;
      color: var(--accent);
    }

    .demo-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .demo-card {
      padding: var(--space-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color var(--duration-fast), background-color var(--duration-fast), transform var(--duration-fast);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .demo-card:hover {
      border-color: var(--accent);
      background: var(--accent-glow);
      transform: translateY(-1px);
    }

    .card-lead {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .role-badge {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 4px;
    }

    .role-badge.manager {
      background: rgba(99, 179, 237, 0.12);
      color: var(--accent);
    }

    .role-badge.member {
      background: rgba(104, 211, 145, 0.12);
      color: var(--status-active);
    }

    .role-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .role-email {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-secondary);
    }

    /* ─── RESPONSIVE LAYOUTS ─── */
    @media (max-width: 900px) {
      .brand-panel {
        display: none;
      }
      .form-panel {
        padding: var(--space-lg);
      }
      .form-container {
        max-width: 440px;
      }
    }

    @media (max-width: 480px) {
      .form-header h2 {
        font-size: 24px;
      }
      .sso-buttons {
        grid-template-columns: 1fr;
        gap: var(--space-sm);
        margin-bottom: var(--space-lg);
      }
      .demo-cards {
        grid-template-columns: 1fr;
        gap: var(--space-sm);
      }
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private particleService = inject(ParticleService);

  @ViewChild('particleCanvas') particleCanvas!: ElementRef<HTMLCanvasElement>;

  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage: string | null = null;
  focusedFields = new Set<string>();

  ngOnInit(): void {
    // Auto-redirect if already authenticated or token exists
    if (this.authService.isAuthenticated() || localStorage.getItem('token')) {
      this.router.navigate(['/']);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    if (this.particleCanvas) {
      this.particleService.init(this.particleCanvas.nativeElement);
    }
  }

  ngOnDestroy(): void {
    // ParticleService handles its own requestAnimationFrame clean up in its ngOnDestroy
  }

  showError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fillCreds(email: string): void {
    this.loginForm.patchValue({
      email: email,
      password: 'password'
    });
    this.loginForm.markAsDirty();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'Login failed. Please check your credentials.';
          this.snackBar.open(this.errorMessage!, 'Close', { duration: 3000 });
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid email or password';
        this.snackBar.open(this.errorMessage!, 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }
}

