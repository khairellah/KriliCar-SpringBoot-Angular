import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { decodeJwt, isTokenExpired } from '../auth/jwt.util';
import { Role } from '../models/enums';

/**
 * §3 Spec Frontend : le rôle vérifié est TOUJOURS celui décodé du token lui-même,
 * jamais une valeur mise en cache seule — cohérent avec les @PreAuthorize backend.
 */
export function roleGuard(...allowedRoles: Role[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.token();

    if (!token || isTokenExpired(token)) {
      return router.createUrlTree(['/login']);
    }

    const payload = decodeJwt(token);
    const tokenRoles = payload?.roles?.split(',').map((r) => r.trim()) ?? [];
    const hasAccess = allowedRoles.some((role) => tokenRoles.includes(role));

    return hasAccess ? true : router.createUrlTree(['/forbidden']);
  };
}