package com.kriliCar.controllers;

import com.kriliCar.dtos.BrandDTO;
import com.kriliCar.services.interfaces.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    // Public : alimente la recherche Client (§5.3 CDC)
    @GetMapping
    public ResponseEntity<List<BrandDTO>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @GetMapping("/{code}")
    public ResponseEntity<BrandDTO> getBrandByCode(@PathVariable String code) {
        return ResponseEntity.ok(brandService.getBrandById(code));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BrandDTO> createBrand(@Valid @RequestBody BrandDTO brandDTO) {
        return new ResponseEntity<>(brandService.createBrand(brandDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<BrandDTO> updateBrand(@PathVariable String code, @Valid @RequestBody BrandDTO brandDTO) {
        return ResponseEntity.ok(brandService.updateBrand(code, brandDTO));
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteBrand(@PathVariable String code) {
        brandService.deleteBrand(code);
        return ResponseEntity.noContent().build();
    }
}