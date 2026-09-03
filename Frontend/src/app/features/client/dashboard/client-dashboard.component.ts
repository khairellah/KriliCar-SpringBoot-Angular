import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';

interface DashboardCard {
  icon: string;
  title: string;
  description: string;
  route: string;
}

/**
 * Sprint F8bis : Hub de navigation Client, point d'entrée après connexion
 * (cf. LoginComponent.redirectByRole -> '/client').
 */
@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly email = this.authService.email;
  readonly code = this.authService.code;

  readonly cards: DashboardCard[] = [
    {
      icon: 'person',
      title: 'Mon profil',
      description: 'Modifier mes informations personnelles et mon mot de passe.',
      route: '/client/profile'
    },
    {
      icon: 'search',
      title: 'Rechercher une voiture',
      description: 'Recherche simple ou avancée parmi les voitures disponibles.',
      route: '/search'
    },
    {
      icon: 'favorite',
      title: 'Ma wishlist',
      description: 'Consulter et gérer mes voitures favorites.',
      route: '/client/wishlist'
    },
    {
      icon: 'event_note',
      title: 'Mes réservations',
      description: 'Suivre l\'état de mes réservations et les annuler si besoin.',
      route: '/client/reservations'
    }
  ];
}