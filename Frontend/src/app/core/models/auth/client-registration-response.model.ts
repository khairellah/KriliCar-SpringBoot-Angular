// Reflète Backend/src/main/java/com/kriliCar/dtos/registration/ClientRegistrationResponseDTO.java
export interface ClientRegistrationResponse {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string | null;
}