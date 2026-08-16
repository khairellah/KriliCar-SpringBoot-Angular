package com.kriliCar.exceptions;

import com.kriliCar.dtos.responses.ErrorResponse;
import com.kriliCar.dtos.responses.FieldErrorDTO;
import jakarta.validation.ConstraintViolationException;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 1. Erreurs 400 - Arguments incorrects (validations manuelles dans les services)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // 2. Erreurs 409 - Conflit d'état métier
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // 3. Erreurs 404 - Ressource non trouvée
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // 4. Erreurs 409 - Conflits / Doublons
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // 5. Erreurs 403/401 - Sécurité (AccessDenied)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return buildErrorResponse(HttpStatus.UNAUTHORIZED,
                    "Accès refusé. Un jeton d'authentification valide est requis (401).", request);
        }

        return buildErrorResponse(HttpStatus.FORBIDDEN,
                "Accès refusé. Vous n'avez pas le rôle nécessaire pour cette ressource (403).", request);
    }

    // 6. Erreurs d'actions non autorisées (Horizontales)
    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAction(UnauthorizedActionException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // 7. Erreurs 400 - JSON mal formé (ex: valeur d'enum invalide)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException ife) {
            if (ife.getTargetType() != null && ife.getTargetType().isEnum()) {
                return buildErrorResponse(HttpStatus.BAD_REQUEST,
                        "Valeur invalide '" + ife.getValue() + "' pour le champ attendu ("
                                + ife.getTargetType().getSimpleName() + ").", request);
            }
        }
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Requête mal formée.", request);
    }

    // 8. Erreurs 400 - Validation des DTO (@Valid / @Validated sur @RequestBody, @RequestPart)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        List<FieldErrorDTO> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> FieldErrorDTO.builder()
                        .field(fe.getField())
                        .message(fe.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        String message = buildAggregatedMessage(fieldErrors);
        return buildValidationErrorResponse(message, fieldErrors, request);
    }

    // 🆕 9. Erreurs 400 - Validation sur @RequestParam / @PathVariable
    // (nécessite @Validated au niveau de la classe du contrôleur + contraintes
    // sur les paramètres ; prêt à l'emploi dès qu'un futur endpoint en aura besoin,
    // ex: bornes sur des query params de recherche)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
        List<FieldErrorDTO> fieldErrors = ex.getConstraintViolations().stream()
                .map(cv -> FieldErrorDTO.builder()
                        .field(extractFieldName(cv.getPropertyPath().toString()))
                        .message(cv.getMessage())
                        .build())
                .collect(Collectors.toList());

        String message = buildAggregatedMessage(fieldErrors);
        return buildValidationErrorResponse(message, fieldErrors, request);
    }

    // 10. Erreurs 400 - Partie multipart manquante (ex: "user" absent)
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException ex, WebRequest request) {
        String message = "La partie obligatoire '" + ex.getRequestPartName() + "' est manquante dans la requête.";
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 🆕 11. Erreurs 400 - Paramètre de requête (@RequestParam) totalement absent
    // Ex: PATCH /api/v1/reservations/{code}/status SANS ?status=... (variable obligatoire)
    // Auparavant : tombait dans le handler générique Exception.class -> 500 à tort.
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex, WebRequest request) {
        String message = String.format(
                "Le paramètre obligatoire '%s' (type %s) est manquant dans la requête.",
                ex.getParameterName(), ex.getParameterType());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 12. Erreurs 400 - Paramètre de requête au mauvais type
    // Ex: GET /api/v1/admins/companies?active=abc -> Boolean attendu, String reçu
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, WebRequest request) {
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "attendu";
        String message = String.format(
                "Le paramètre '%s' a une valeur invalide '%s'. Type attendu : %s.",
                ex.getName(), ex.getValue(), requiredType
        );
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    // 13. Erreurs 400 - Paramètres de requête invalides levés manuellement (ex: ville/statut hors enum)
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleCoyoteBadRequest(BadRequestException ex, WebRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // 14. Fallback 500 - Erreur interne générique
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex, WebRequest request) {
        log.error("Erreur interne non gérée sur {} : ", request.getDescription(false), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur inattendue est survenue. Veuillez réessayer plus tard.", request);
    }

    // ============================ Helpers ============================

    private String buildAggregatedMessage(List<FieldErrorDTO> fieldErrors) {
        return fieldErrors.stream()
                .map(fe -> fe.getField() + " : " + fe.getMessage())
                .collect(Collectors.joining(" ; "));
    }

    /**
     * US-9.2 : extrait le nom court du champ depuis un property path Jakarta Validation
     * (ex: "searchCars.nbrSeats" -> "nbrSeats").
     */
    private String extractFieldName(String propertyPath) {
        int lastDot = propertyPath.lastIndexOf('.');
        return lastDot >= 0 ? propertyPath.substring(lastDot + 1) : propertyPath;
    }

    private ResponseEntity<ErrorResponse> buildValidationErrorResponse(
            String message, List<FieldErrorDTO> fieldErrors, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .errors(fieldErrors.isEmpty() ? Collections.emptyList() : fieldErrors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(HttpStatus status, String message, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        return new ResponseEntity<>(error, status);
    }
}