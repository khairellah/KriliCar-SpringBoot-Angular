package com.kriliCar.controllers;

import com.kriliCar.dtos.ModelDTO;
import com.kriliCar.services.interfaces.ModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/models")
@RequiredArgsConstructor
public class ModelController {

    private final ModelService modelService;

    // Créer un modèle (Admin seulement)
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ModelDTO> createModel(@Valid @RequestBody ModelDTO modelDTO) {
        return new ResponseEntity<>(modelService.createModel(modelDTO), HttpStatus.CREATED);
    }

    // Modifier un modèle (Admin seulement)
    @PutMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ModelDTO> updateModel(@PathVariable String code, @Valid @RequestBody ModelDTO modelDTO) {
        return ResponseEntity.ok(modelService.updateModel(code, modelDTO));
    }

    // Supprimer un modèle (Admin seulement)
    @DeleteMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteModel(@PathVariable String code) {
        modelService.deleteModel(code);
        return ResponseEntity.noContent().build();
    }

    // Récupérer un modèle par son code (Public)
    @GetMapping("/{code}")
    public ResponseEntity<ModelDTO> getModelByCode(@PathVariable String code) {
        return ResponseEntity.ok(modelService.getModelByCode(code));
    }

    // Tout récupérer (Public)
    @GetMapping
    public ResponseEntity<List<ModelDTO>> getAllModels() {
        return ResponseEntity.ok(modelService.getAllModels());
    }

    // Récupérer les modèles d'une marque spécifique (Public)
    @GetMapping("/brand/{brandCode}")
    public ResponseEntity<List<ModelDTO>> getModelsByBrand(@PathVariable String brandCode) {
        return ResponseEntity.ok(modelService.getModelsByBrand(brandCode));
    }
}