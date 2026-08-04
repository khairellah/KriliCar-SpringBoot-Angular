package com.kriliCar.exceptions;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// @ResponseStatus assure que cette exception renvoie le statut HTTP 404
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    // Constructeur principal
    public ResourceNotFoundException(String message) {
        super(message);
    }

    // Constructeur plus détaillé (facultatif mais recommandé pour plus de clarté)
    // Flexibilité du Constructeur : Le constructeur détaillé vous permet de générer des messages clairs comme : "Marque non trouvé avec id : '123'" sans polluer vos contrôleurs.
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s non trouvé avec %s : '%s'", resourceName, fieldName, fieldValue));
    }
}