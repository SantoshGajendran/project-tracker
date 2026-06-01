import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = sessionStorage.getItem('token');

  if (!token || token === 'null' || token === 'undefined') {
    router.navigate(['/login']);
    return false;
  }

  if (authService.currentUser()) {
    return true;
  }

  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
