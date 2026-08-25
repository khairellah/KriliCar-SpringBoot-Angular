import { CarAvailability } from '../enums';

/**
 * US-3.4 : Paramètres de requête pour GET /api/v1/cars/my-fleet (endpoint scopé COMPANY).
 * Reflète les @RequestParam de CarController.searchMyFleet(...).
 *
 * ⚠️ `brand` et `model` sont matchés par NOM côté backend (LIKE sur
 * c.brand.name / c.model.name, cf. CarRepository.searchCompanyCars) — jamais
 * par code, exactement comme CarSearchParams (US-3.3).
 *
 * ⚠️ Pas de champ `companyCode` : le scope est résolu côté backend via le
 * token JWT (Authentication) — jamais transmis en paramètre libre par le
 * Frontend (cf. §4.3 Spec Frontend : "aucun paramètre companyCode à envoyer").
 *
 * ⚠️ Pas de champ `city` (contrairement à CarSearchParams) : la ville de la
 * Company est fixe, non pertinente en filtre sur son propre parc.
 *
 * `availability` : contrairement à la recherche Client (toujours AVAILABLE),
 * ce filtre est optionnel et peut cibler AVAILABLE / MAINTENANCE / RESERVED,
 * ou être omis pour voir tout le parc.
 */
export interface CompanyFleetSearchParams {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  nbrSeats?: number;
  availability?: CarAvailability;
}