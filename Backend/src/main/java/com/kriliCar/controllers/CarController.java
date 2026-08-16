package com.kriliCar.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kriliCar.dtos.CarDTO;
import com.kriliCar.services.interfaces.CarService;
import com.kriliCar.validation.ValidationGroups;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    private final ObjectMapper objectMapper; // 🆕 US-9.2 (fix) : bean Jackson auto-configuré par Spring Boot
    private final Validator validator;       // 🆕 US-9.2 (fix) : bean Jakarta Validation auto-configuré

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CarDTO> createCar(
            @Validated(ValidationGroups.OnCreate.class) // 🔧 US-9.2
            @RequestPart("car") String carJson, // 🔧 FIX : String brute au lieu de CarDTO directement
            // @RequestPart("car") CarDTO carDTO, 'OLD CODE'
            @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles,
            Authentication authentication) throws IOException {
        /* OLD CODE
          return new ResponseEntity<>(carService.createCar(carDTO, imageFiles, authentication), HttpStatus.CREATED);
        */

        CarDTO carDTO = parseCarJson(carJson);
        validateOrThrow(carDTO, ValidationGroups.OnCreate.class);

        return new ResponseEntity<>(carService.createCar(carDTO, imageFiles, authentication), HttpStatus.CREATED);
    }


    @GetMapping
    public ResponseEntity<Page<CarDTO>> getAllCars(
            @RequestParam(required = false) String companyCode,
            Pageable pageable) {
        return ResponseEntity.ok(carService.getAllCars(companyCode, pageable));
    }

    // US-3.4 : Catalogue de la Company connectée (tous statuts), mêmes filtres
    // que la recherche Client, mais scope automatiquement restreint via le token
    @GetMapping("/my-fleet")
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<Page<CarDTO>> searchMyFleet(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minMileage,
            @RequestParam(required = false) Integer maxMileage,
            @RequestParam(required = false) Integer nbrSeats,
            @RequestParam(required = false) String availability,
            Authentication authentication,
            Pageable pageable) throws BadRequestException {
        return ResponseEntity.ok(carService.searchMyFleet(
                brand, model, minPrice, maxPrice, minMileage, maxMileage,
                nbrSeats, availability, authentication, pageable));
    }

    @GetMapping("/{code}")
    public ResponseEntity<CarDTO> getCarByCode(@PathVariable String code) {
        return ResponseEntity.ok(carService.getCarByCode(code));
    }

    @PutMapping(value = "/{code}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CarDTO> updateCar(
            @PathVariable String code,
            @Validated(ValidationGroups.OnUpdate.class) // 🔧 US-9.2
            // @RequestPart("car") CarDTO carDTO, 'OLD CODE'
            @RequestPart("car") String carJson, // 🔧 FIX : String brute au lieu de CarDTO directement
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            // ⚠️ imagesToDelete attend désormais des CODES métier (ex: "a1b2c3d4e5f6"), plus des IDs
            @RequestParam(value = "imagesToDelete", required = false) List<String> imagesToDelete,
            Authentication authentication) throws IOException {
        /* OLD CODE
        //return ResponseEntity.ok(carService.updateCar(code, carDTO, newImages, imagesToDelete, authentication));
        */

        CarDTO carDTO = parseCarJson(carJson);
        validateOrThrow(carDTO, ValidationGroups.OnUpdate.class);

        return ResponseEntity.ok(carService.updateCar(code, carDTO, newImages, imagesToDelete, authentication));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<Void> deleteCar(@PathVariable String code, Authentication authentication) {
        carService.deleteCar(code, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CarDTO>> searchCars(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minMileage,
            @RequestParam(required = false) Integer maxMileage,
            @RequestParam(required = false) Integer nbrSeats,
            Pageable pageable) throws BadRequestException {
        return ResponseEntity.ok(carService.searchCars(
                brand, model, city, minPrice, maxPrice, minMileage, maxMileage, nbrSeats, pageable));
    }

    // ============================ Helpers (US-9.2 fix) ============================

    /**
     * Parse la partie "car" reçue en String brute, indépendamment du Content-Type
     * réellement envoyé par le client (Swagger UI envoie souvent
     * "application/octet-stream" au lieu de "application/json" pour les parties
     * objet d'un multipart/form-data — bug connu côté clients, pas côté Spring).
     */
    private CarDTO parseCarJson(String carJson) {
        try {
            return objectMapper.readValue(carJson, CarDTO.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(
                    "Le format JSON de la partie 'car' est invalide : " + e.getOriginalMessage());
        }
    }

    /**
     * Remplace le déclenchement automatique de @Valid (perdu car "car" n'est plus
     * résolu comme un objet typé par Spring MVC) par une validation manuelle avec
     * le bon groupe (OnCreate / OnUpdate). Toute violation lève une
     * ConstraintViolationException, déjà gérée par GlobalExceptionHandler (US-9.2).
     */
    private void validateOrThrow(CarDTO dto, Class<?> group) {
        Set<ConstraintViolation<CarDTO>> violations = validator.validate(dto, group);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
    }

}