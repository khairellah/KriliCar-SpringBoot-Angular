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
    // Sprint F8bis : Hub Client — point d'entrée après login (cf. redirectByRole)
    path: 'client',
    canActivate: [authGuard, roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/client/dashboard/client-dashboard.component').then(
        (m) => m.ClientDashboardComponent
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
    // Sprint F8bis : Hub Admin — point d'entrée après login (cf. redirectByRole)
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      )
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
    // Sprint F8bis : Hub Company — point d'entrée après login (cf. redirectByRole)
    path: 'company',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/dashboard/company-dashboard.component').then(
        (m) => m.CompanyDashboardComponent
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
    // US-6.1 : Demande de Boost (Company) — protégé authGuard + roleGuard(['COMPANY'])
    path: 'company/boost',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/boost/company-boost.component').then(
        (m) => m.CompanyBoostComponent
      )
  },
    {
    // US-8.2 : Dashboard KPI Company (scopé) — protégé authGuard + roleGuard(['COMPANY'])
    path: 'company/kpi',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/kpi/company-kpi.component').then(
        (m) => m.CompanyKpiComponent
      )
  },
  {
    // US-6.2 : Demandes de Boost en attente + activation (Admin)
    path: 'admin/companies/boost-pending',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/boost-pending/admin-boost-pending.component').then(
        (m) => m.AdminBoostPendingComponent
      )
  },
  {
    // US-7.1 : Liste des sociétés filtrable (Admin) — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/companies',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/companies/admin-company-list.component').then(
        (m) => m.AdminCompanyListComponent
      )
  },
  {
    // US-7.5 : Détail complet d'une société (Admin) — après 'admin/companies' (static)
    // et 'admin/companies/boost-pending' (static), pour ne jamais capturer un
    // segment statique dans le paramètre dynamique :code.
    path: 'admin/companies/:code',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/companies/admin-company-detail.component').then(
        (m) => m.AdminCompanyDetailComponent
      )
  },
  {
    // US-7.3 : Liste des clients filtrable (Admin) — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/clients',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/clients/admin-client-list.component').then(
        (m) => m.AdminClientListComponent
      )
  },
  {
    // US-7.5 : Détail complet d'un client (Admin)
    path: 'admin/clients/:code',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/clients/admin-client-detail.component').then(
        (m) => m.AdminClientDetailComponent
      )
  },
  {
    // US-8.1 : Dashboard KPI globaux (Admin) — protégé authGuard + roleGuard(['ADMIN'])
    path: 'admin/kpi',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/kpi/admin-kpi.component').then((m) => m.AdminKpiComponent)
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
    // US-5.2 : Mes réservations (Client) — GET /api/v1/reservations/my
    path: 'client/reservations',
    canActivate: [authGuard, roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/client/reservations/reservation-list.component').then(
        (m) => m.ClientReservationListComponent
      )
  },
  {
    // US-5.2 : Réservations reçues (Company) — GET /api/v1/reservations/my
    path: 'company/reservations',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/company/reservations/reservation-list.component').then(
        (m) => m.CompanyReservationListComponent
      )
  },
    {
    // US-5.3 : Détail réservation (Client) — GET /api/v1/reservations/{code}
    path: 'client/reservations/:code',
    canActivate: [authGuard, roleGuard('CLIENT')],
    loadComponent: () =>
      import('./features/client/reservations/reservation-detail.component').then(
        (m) => m.ReservationDetailComponent
      )
  },
  {
    // US-5.3 : Détail réservation (Company) — GET /api/v1/reservations/{code}
    path: 'company/reservations/:code',
    canActivate: [authGuard, roleGuard('COMPANY')],
    loadComponent: () =>
      import('./features/client/reservations/reservation-detail.component').then(
        (m) => m.ReservationDetailComponent
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
