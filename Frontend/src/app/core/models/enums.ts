// Enums métier répliqués depuis le backend (Backend/src/main/java/com/kriliCar/enums/Role.java)
export type Role = 'ADMIN' | 'COMPANY' | 'CLIENT';

// Backend/src/main/java/com/kriliCar/enums/City.java
// ⚠️ Liste actuelle du backend ; le commentaire "// ... autres villes" dans l'enum Java
// indique qu'elle est susceptible de s'étendre. Vérifier City.java avant toute évolution.
export type City = 'RABAT' | 'CASABLANCA' | 'MARRAKECH' | 'TANGIER';