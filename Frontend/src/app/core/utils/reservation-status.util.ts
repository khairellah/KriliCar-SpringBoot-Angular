import { ReservationStatus } from '../models/enums';

/**
 * US-5.5 : Descriptions courtes du cycle de vie d'une réservation, affichées
 * en complément du badge de statut. Purement informatif — AUCUNE action
 * n'est déclenchée depuis ce fichier ni depuis les écrans qui l'utilisent.
 *
 * Reflète le cycle de vie décrit en §8 de 6_Spécification_Frontend_Angular_KriliCar.md :
 *   PENDING   → en attente de traitement par la société
 *   CONFIRMED → active, véhicule RESERVED
 *   CANCELLED → terminal, aucune action possible
 *   COMPLETED → terminal, véhicule repassé AVAILABLE — déclenchement HORS
 *               périmètre UI (aucun bouton Front), géré exclusivement côté
 *               backend (cf. ReservationServiceImpl.updateReservationStatus)
 */
export const RESERVATION_STATUS_DESCRIPTIONS: Record<ReservationStatus, string> = {
  PENDING: 'En attente de confirmation par la société.',
  CONFIRMED: 'Réservation confirmée : le véhicule est réservé pour cette période.',
  CANCELLED: 'Réservation annulée. Aucune action supplémentaire n’est possible.',
  COMPLETED:
    'Réservation terminée : le véhicule a été rendu et est de nouveau disponible à la location.'
};

/**
 * Statuts terminaux du cycle de vie (§8 Spec Frontend) : aucune action
 * (Confirmer/Annuler) ne doit jamais être proposée sur ces statuts.
 */
export function isTerminalReservationStatus(status: ReservationStatus): boolean {
  return status === 'CANCELLED' || status === 'COMPLETED';
}