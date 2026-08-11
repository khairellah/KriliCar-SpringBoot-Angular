package com.kriliCar.controllers;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.services.interfaces.CarService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CarDTO> createCar(
            @RequestPart("car") CarDTO carDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles,
            Authentication authentication) throws IOException {
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
            @RequestPart("car") CarDTO carDTO,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            // ⚠️ imagesToDelete attend désormais des CODES métier (ex: "a1b2c3d4e5f6"), plus des IDs
            @RequestParam(value = "imagesToDelete", required = false) List<String> imagesToDelete,
            Authentication authentication) throws IOException {
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

}