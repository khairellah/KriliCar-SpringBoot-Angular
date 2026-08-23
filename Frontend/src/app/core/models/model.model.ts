// Reflète Backend/src/main/java/com/kriliCar/dtos/ModelDTO.java (lecture)
export interface Model {
  code: string;      // Identifiant métier, généré, jamais fourni en entrée
  name: string;
  brandCode: string;
  brandName: string; // Champ lecture seule, rempli par le backend
}