import { City } from '../enums';

/**
 * US-3.3 : Paramètres de requête pour GET /api/v1/cars/search (endpoint public).
 * Reflète les @RequestParam de CarController.searchCars(...).
 *
 * ⚠️ `brand` et `model` sont matchés par NOM côté backend (LIKE sur
 * c.brand.name / c.model.name, cf. CarRepository.searchCars) — jamais par
 * code. Le composant doit donc résoudre le nom correspondant au code
 * sélectionné dans les selects avant de construire cet objet.
 */
export interface CarSearchParams {
  brand?: string;
  model?: string;
  city?: City;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  nbrSeats?: number;
}