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
 * Sprint F8bis : Hub de navigation Admin, point d'entrée après connexion
 * (cf. LoginComponent.redirectByRole -> '/admin'). Regroupe l'accès à
 * toutes les fonctionnalités livrées (Sprints F1 à F8) sans appel backend
 * supplémentaire : uniquement des liens vers les écrans déjà développés.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly email = this.authService.email;
  readonly code = this.authService.code;

  readonly cards: DashboardCard[] = [
    {
      icon: 'person',
      title: 'Mon profil',
      description: 'Modifier mes informations personnelles et mon mot de passe.',
      route: '/admin/profile'
    },
    {
      icon: 'sell',
      title: 'Marques',
      description: 'Créer, modifier et supprimer les marques de voitures.',
      route: '/admin/brands'
    },
    {
      icon: 'directions_car',
      title: 'Modèles',
      description: 'Gérer les modèles de voitures, rattachés à une marque.',
      route: '/admin/models'
    },
    {
      icon: 'business',
      title: 'Sociétés',
      description: 'Lister, filtrer et activer/désactiver les sociétés de location.',
      route: '/admin/companies'
    },
    {
      icon: 'people',
      title: 'Clients',
      description: 'Lister, filtrer et activer/désactiver les comptes clients.',
      route: '/admin/clients'
    },
    {
      icon: 'rocket_launch',
      title: 'Demandes de Boost',
      description: 'Valider et activer les demandes de Boost en attente.',
      route: '/admin/companies/boost-pending'
    },
    {
      icon: 'bar_chart',
      title: 'Tableau de bord',
      description: 'KPI globaux de la plateforme (sociétés, clients, réservations, voitures).',
      route: '/admin/kpi'
    }
  ];
}