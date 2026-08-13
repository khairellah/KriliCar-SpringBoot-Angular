package com.kriliCar.enums;

public enum ReservationStatus {
    PENDING,    // En attente de confirmation
    CONFIRMED,  // Confirmée et active
    CANCELLED,  // Annulée
    COMPLETED   // Terminée (après le retour du véhicule)
}