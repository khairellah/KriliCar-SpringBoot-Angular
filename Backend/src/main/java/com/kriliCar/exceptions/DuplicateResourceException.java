package com.kriliCar.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT) // Mappe cette exception au code HTTP 409
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String resource, String field, String value) {
        super(String.format("%s avec %s '%s' existe déjà. Veuillez en choisir un autre.", resource, field, value));
    }
}