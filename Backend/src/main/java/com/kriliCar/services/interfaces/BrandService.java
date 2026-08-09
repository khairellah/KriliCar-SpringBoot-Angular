package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.BrandDTO;
import java.util.List;

public interface BrandService {
    BrandDTO createBrand(BrandDTO brandDTO);
    BrandDTO updateBrand(String code, BrandDTO brandDTO);
    void deleteBrand(String code);
    List<BrandDTO> getAllBrands();
    BrandDTO getBrandById(String code);
}