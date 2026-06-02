import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const token = sessionStorage.getItem('token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Auto-redirect to login on 401 Unauthorized
      if (error.status === 401) {
        sessionStorage.removeItem('token');
        router.navigate(['/login']);
      } else if (error.status === 403 && req.url.includes('/api/tasks')) {
        snackBar.open('You can only edit tasks assigned to you in your projects.', 'Close', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
      return throwError(() => error);
    })
  );
};
