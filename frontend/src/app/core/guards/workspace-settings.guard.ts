import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const workspaceSettingsGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!localStorage.getItem('token')) {
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.currentUser();
  if (currentUser) {
    if (currentUser.role === 'MANAGER' || currentUser.role === 'TEAM_LEAD') {
      return true;
    }
    router.navigate(['/settings/profile']);
    return false;
  }

  // Fallback: fetch current user to ensure it is loaded on page refresh
  return authService.getCurrentUser().pipe(
    map(user => {
      if (user && (user.role === 'MANAGER' || user.role === 'TEAM_LEAD')) {
        return true;
      }
      router.navigate(['/settings/profile']);
      return false;
    })
  );
};
