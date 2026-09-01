// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/ClientStatsDTO.java
export interface ClientStatsDTO {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  completedReservations: number;
  wishlistCount: number;
}