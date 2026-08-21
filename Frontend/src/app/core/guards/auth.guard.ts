import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { isTokenExpired } from '../auth/jwt.util';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();

  if (token && !isTokenExpired(token)) {
    return true;
  }

  if (token) {
    // Token présent mais expiré : purge de la session invalide avant redirection.
    authService.logout();
  }

  return router.createUrlTree(['/login']);
};