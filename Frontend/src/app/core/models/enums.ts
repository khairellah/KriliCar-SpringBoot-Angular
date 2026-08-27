// Enums métier répliqués depuis le backend (Backend/src/main/java/com/kriliCar/enums/Role.java)
export type Role = 'ADMIN' | 'COMPANY' | 'CLIENT';

// Backend/src/main/java/com/kriliCar/enums/City.java
// ⚠️ Liste actuelle du backend ; le commentaire "// ... autres villes" dans l'enum Java
// indique qu'elle est susceptible de s'étendre. Vérifier City.java avant toute évolution.
export type City = 'RABAT' | 'CASABLANCA' | 'MARRAKECH' | 'TANGIER';

// --- US-3.1 : enums voitures (Backend/src/main/java/com/kriliCar/enums/*.java) ---
export type CarAvailability = 'AVAILABLE' | 'MAINTENANCE' | 'RESERVED';
export type CarColor =
  | 'WHITE' | 'BLACK' | 'GREY' | 'RED' | 'BLUE' | 'SILVER' | 'GREEN' | 'YELLOW';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type Gearbox = 'MANUAL' | 'AUTOMATIC';

// --- US-5.1 : enum réservation (Backend/src/main/java/com/kriliCar/enums/ReservationStatus.java) ---
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';