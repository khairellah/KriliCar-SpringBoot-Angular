package com.kriliCar.services.impl;

import com.kriliCar.dtos.BrandDTO;
import com.kriliCar.entities.Brand;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.mappers.BrandMapper;
import com.kriliCar.repositories.BrandRepository;
import com.kriliCar.services.interfaces.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    private static final String RESOURCE_NAME = "Marque";

    @Override
    @Transactional
    public BrandDTO createBrand(BrandDTO brandDTO) {
        if (brandRepository.existsByName(brandDTO.getName())) {
            throw new DuplicateResourceException(RESOURCE_NAME, "nom", brandDTO.getName());
        }
        Brand brand = brandMapper.toEntity(brandDTO);
        return brandMapper.toDTO(brandRepository.save(brand));
    }

    @Override
    @Transactional
    public BrandDTO updateBrand(String code, BrandDTO brandDTO) {
        Brand existingBrand = brandRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "code", code));

        if (!existingBrand.getName().equalsIgnoreCase(brandDTO.getName())
                && brandRepository.existsByName(brandDTO.getName())) {
            throw new DuplicateResourceException(RESOURCE_NAME, "nom", brandDTO.getName());
        }

        existingBrand.setName(brandDTO.getName());
        return brandMapper.toDTO(brandRepository.save(existingBrand));
    }

    @Override
    @Transactional
    public void deleteBrand(String code) {
        if (brandRepository.findByCode(code).isEmpty()) {
            throw new ResourceNotFoundException(RESOURCE_NAME, "code", code);
        }
        brandRepository.deleteByCode(code);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandDTO> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(brandMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BrandDTO getBrandById(String code) {
        return brandRepository.findByCode(code)
                .map(brandMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "code", code));
    }
}