import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * §6 Spec Frontend — mapping HTTP → UX :
 * - 401 (hors /auth/**)   : session invalide/expirée -> déconnexion forcée + redirection /login
 * - 401 sur /auth/login   : identifiants invalides -> laissé à login.component.ts (déjà géré)
 * - 0 / >=500             : erreur réseau ou interne -> message générique, jamais de stack
 * - 400/403/404/409       : laissés aux composants (déjà gérés localement, ex: register-*.component.ts)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const isAuthRequest = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        const wasAuthenticated = authService.isAuthenticated();
        authService.logout();
        if (router.url !== '/login') {
          if (wasAuthenticated) {
            snackBar.open('Votre session a expiré. Veuillez vous reconnecter.', 'Fermer', {
              duration: 5000
            });
          }
          router.navigateByUrl('/login');
        }
      } else if (error.status === 0 || error.status >= 500) {
        snackBar.open('Une erreur est survenue. Veuillez réessayer plus tard.', 'Fermer', {
          duration: 5000
        });
      }
      return throwError(() => error);
    })
  );
};