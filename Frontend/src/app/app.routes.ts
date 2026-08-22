import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register/client',
    loadComponent: () =>
      import('./features/auth/register-client/register-client.component').then(
        (m) => m.RegisterClientComponent
      )
  },
  {
    path: 'register/company',
    loadComponent: () =>
      import('./features/auth/register-company/register-company.component').then(
        (m) => m.RegisterCompanyComponent
      )
  },
  {
    // US-1.5 : Profil Client — protégé authGuard + roleGuard(['CLIENT'])
    path: 'client/profile',
    canActivate: [authGuard, roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/client/profile/client-profile.component').then(
        (m) => m.ClientProfileComponent
      )
  },
  {
    // US-1.4 : cible de redirection de roleGuard en cas de rôle insuffisant.
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent)
  },
  // Redirection temporaire : la vraie page d'accueil publique (recherche
  // simple) sera livrée dans une US ultérieure (Sprint F3).
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];