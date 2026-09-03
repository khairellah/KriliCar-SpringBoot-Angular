import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { PendingReservationsBadgeComponent } from '../../../shared/components/pending-reservations-badge/pending-reservations-badge.component';

interface DashboardCard {
  icon: string;
  title: string;
  description: string;
  route: string;
}

/**
 * Sprint F8bis : Hub de navigation Company, point d'entrée après connexion
 * (cf. LoginComponent.redirectByRole -> '/company'). Le badge de
 * notification (US-5.7) est affiché en en-tête, réutilisé tel quel.
 */
@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, PendingReservationsBadgeComponent],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.scss'
})
export class CompanyDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly email = this.authService.email;
  readonly code = this.authService.code;

  readonly cards: DashboardCard[] = [
    {
      icon: 'business',
      title: 'Mon profil',
      description: "Modifier les informations de la société et mon mot de passe.",
      route: '/company/profile'
    },
    {
      icon: 'directions_car',
      title: 'Mes voitures',
      description: 'Ajouter, modifier ou supprimer les voitures de mon parc.',
      route: '/company/cars'
    },
    {
      icon: 'search',
      title: 'Mon parc',
      description: 'Rechercher/filtrer mes propres voitures (tous statuts).',
      route: '/company/my-fleet'
    },
    {
      icon: 'event_available',
      title: 'Réservations reçues',
      description: 'Consulter, confirmer ou annuler les réservations clients.',
      route: '/company/reservations'
    },
    {
      icon: 'rocket_launch',
      title: 'Option Boost',
      description: 'Demander la mise en avant de mes annonces.',
      route: '/company/boost'
    },
    {
      icon: 'bar_chart',
      title: 'Mes statistiques',
      description: 'KPI de mon parc et de mes réservations.',
      route: '/company/kpi'
    }
  ];
}