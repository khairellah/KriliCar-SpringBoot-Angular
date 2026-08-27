import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    // US-3.3 : Recherche publique simple/avancée (Espace Public, non authentifié)
    path: 'search',
    loadComponent: () =>
      import('./features/search/car-search.component').then((m) => m.CarSearchComponent)
  },
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
    // US-4.1 : WishList Client — protégé authGuard + roleGuard(['CLIENT'])
    path: 'client/wishlist',
    canActivate: [authGuard, roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/client/wishlist/wishlist.component').then((m) => m.WishlistComponent)
  },
  {
    // US-1.6 : Profil Admin — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/profile',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/profile/admin-profile.component').then(
        (m) => m.AdminProfileComponent
      )
  },
  {
    // US-1.7 : Profil Company — protégé authGuard + roleGuard(['COMPANY'])
    path: 'company/profile',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/profile/company-profile.component').then(
        (m) => m.CompanyProfileComponent
      )
  },
  {
    // US-2.1 : Gestion des marques (Admin) — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/brands',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/brands/brand-list.component').then(
        (m) => m.BrandListComponent
      )
  },
  {
    // US-2.2 : Gestion des modèles (Admin) — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/models',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/models/model-list.component').then(
        (m) => m.ModelListComponent
      )
  },
  {
    // US-3.1 : Liste des voitures de la Company connectée
    path: 'company/cars',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/cars/car-list.component').then((m) => m.CarListComponent)
  },
  {
    // US-3.4 : Mon parc (recherche interne Company, scope auto) — GET /api/v1/cars/my-fleet
    path: 'company/my-fleet',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/my-fleet/my-fleet.component').then((m) => m.MyFleetComponent)
  },
  {
    // US-3.1 : Création d'une voiture — DOIT être déclarée avant ':code/edit'
    path: 'company/cars/new',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/cars/car-form.component').then((m) => m.CarFormComponent)
  },
  {
    // US-3.1 : Modification d'une voiture
    path: 'company/cars/:code/edit',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/cars/car-form.component').then((m) => m.CarFormComponent)
  },
  {
  // US-5.1 : Création réservation (Client) — protégé authGuard + roleGuard(['CLIENT'])
  path: 'client/reservations/new/:carCode',
  canActivate: [authGuard, roleGuard('CLIENT')],
  loadComponent: () =>
    import('./features/client/reservations/reservation-form.component').then(
      (m) => m.ReservationFormComponent
    )
},
  {
    // US-1.4 : cible de redirection de roleGuard en cas de rôle insuffisant.
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent)
  },
  // US-3.3 : la page d'accueil publique pointe désormais vers la recherche
  // (recherche simple visible par défaut, avancée dépliable via toggle).
  { path: '', redirectTo: 'search', pathMatch: 'full' }
];
