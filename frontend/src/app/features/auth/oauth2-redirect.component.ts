import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  template: `
    <div class="oauth-redirect-screen">
      <div class="oauth-spinner"></div>
      <p class="oauth-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .oauth-redirect-screen {
      width: 100vw;
      height: 100vh;
      background: #080A0F;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .oauth-spinner {
      width: 32px;
      height: 32px;
      border: 2px solid rgba(99, 179, 237, 0.2);
      border-top-color: #63B3ED;
      border-radius: 50%;
      animation: spin 600ms linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .oauth-message {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #4A5568;
    }
  `]
})
export class OAuth2RedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  message = 'Completing sign-in...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (token) {
      this.auth.setToken(token);
      this.message = 'Signed in successfully. Redirecting...';
      this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
      this.router.navigate(['/'], { replaceUrl: true });
    } else if (error) {
      this.message = 'Sign-in failed. Redirecting...';
      this.snackBar.open(decodeURIComponent(error), 'Close', { duration: 5000 });
      this.router.navigate(['/login'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
