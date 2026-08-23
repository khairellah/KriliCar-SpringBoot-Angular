import { CarAvailability, CarColor, FuelType, Gearbox } from '../enums';

// Payloads d'écriture pour la part "car" (JSON) des requêtes multipart
// POST/PUT /api/v1/cars. US-3.1 : gestion SANS images (newImages/imagesToDelete
// réservés à l'US-3.2 — omis ici, le backend les accepte en optionnel).

/**
 * POST /api/v1/cars — brandCode/modelCode obligatoires uniquement à la création
 * (@NotBlank(groups = OnCreate.class) côté CarDTO backend).
 */
export interface CarCreateRequest {
  vin: string;
  year: number;
  mileage: number | null;
  gearbox: Gearbox | null;
  fuelType: FuelType | null;
  color: CarColor | null;
  description: string;
  nbrSeats: number | null;
  price: number | null;
  availability: CarAvailability;
  brandCode: string;
  modelCode: string;
}

/**
 * PUT /api/v1/cars/{code} — ⚠️ brandCode/modelCode volontairement ABSENTS :
 * CarServiceImpl.updateCar() ne modifie jamais la marque/le modèle d'une
 * voiture existante, ils sont donc omis pour ne pas laisser croire au Front
 * qu'un envoi serait pris en compte.
 */
export interface CarUpdateRequest {
  vin: string;
  year: number;
  mileage: number | null;
  gearbox: Gearbox | null;
  fuelType: FuelType | null;
  color: CarColor | null;
  description: string;
  nbrSeats: number | null;
  price: number | null;
  availability: CarAvailability;
}