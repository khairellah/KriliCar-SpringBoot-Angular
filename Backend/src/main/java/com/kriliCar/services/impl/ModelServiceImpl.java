package com.kriliCar.services.impl;


import com.kriliCar.dtos.ModelDTO;
import com.kriliCar.entities.Brand;
import com.kriliCar.entities.Model;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.mappers.ModelMapper;
import com.kriliCar.repositories.BrandRepository;
import com.kriliCar.repositories.ModelRepository;
import com.kriliCar.services.interfaces.ModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModelServiceImpl implements ModelService {

    private final ModelRepository modelRepository;
    private final BrandRepository brandRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public ModelDTO createModel(ModelDTO modelDTO) {
        // 1. Vérifier si la marque existe
        Brand brand = brandRepository.findByCode(modelDTO.getBrandCode())
                .orElseThrow(() -> new ResourceNotFoundException("Marque introuvable avec le code : " + modelDTO.getBrandCode()));

        // 2. Vérifier si le modèle existe déjà pour cette marque précise
        if (modelRepository.findByNameAndBrandCode(modelDTO.getName(), modelDTO.getBrandCode()).isPresent()) {
            throw new DuplicateResourceException("Modèle", "nom", modelDTO.getName());
        }

        // 3. Mapping et association
        Model model = modelMapper.toEntity(modelDTO);
        model.setBrand(brand);

        return modelMapper.toDTO(modelRepository.save(model));
    }

    @Override
    @Transactional
    public ModelDTO updateModel(String code, ModelDTO modelDTO) {
        // 1. Charger le modèle existant
        Model existingModel = modelRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle introuvable avec le code : " + code));

        // 2. Si le nom change, vérifier les doublons pour la marque actuelle
        if (!existingModel.getName().equalsIgnoreCase(modelDTO.getName())) {
            if (modelRepository.findByNameAndBrandCode(modelDTO.getName(), existingModel.getBrand().getCode()).isPresent()) {
                throw new DuplicateResourceException("Modèle", "nom", modelDTO.getName());
            }
            existingModel.setName(modelDTO.getName());
        }

        // 3. Si on veut changer la marque du modèle
        if (modelDTO.getBrandCode() != null && !existingModel.getBrand().getCode().equals(modelDTO.getBrandCode())) {
            Brand newBrand = brandRepository.findByCode(modelDTO.getBrandCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Nouvelle marque introuvable : " + modelDTO.getBrandCode()));
            existingModel.setBrand(newBrand);
        }

        return modelMapper.toDTO(modelRepository.save(existingModel));
    }

    @Override
    public ModelDTO getModelByCode(String code) {
        return modelRepository.findByCode(code)
                .map(modelMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle introuvable avec le code : " + code));
    }

    @Override
    public List<ModelDTO> getAllModels() {
        return modelRepository.findAll().stream()
                .map(modelMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ModelDTO> getModelsByBrand(String brandCode) {
        // Vérifier si la marque existe d'abord
        if (!brandRepository.findByCode(brandCode).isPresent()) {
            throw new ResourceNotFoundException("Marque introuvable avec le code : " + brandCode);
        }
        return modelRepository.findByBrandCode(brandCode).stream()
                .map(modelMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteModel(String code) {
        Model model = modelRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Modèle introuvable avec le code : " + code));
        modelRepository.delete(model);
    }
}