import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

const AUTH_PREFIX = `${environment.apiUrl}/auth/`;

/**
 * §7 Spec Frontend : ajoute Authorization: Bearer <token> sur toutes les
 * requêtes vers notre API, sauf les routes d'authentification (login/register),
 * qui sont anonymes par nature.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.url.startsWith(AUTH_PREFIX)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.token();

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};