import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  // Redirection temporaire : la vraie page d'accueil publique (recherche
  // simple) sera livrée dans une US ultérieure (Sprint F3).
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];