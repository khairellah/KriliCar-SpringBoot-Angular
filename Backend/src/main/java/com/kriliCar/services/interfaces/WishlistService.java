package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.exceptions.ResourceNotFoundException;
import java.util.List;

public interface WishlistService {
    List<CarDTO> getClientWishlist(String userEmail);
    CarDTO addCarToWishlist(String carCode, String userEmail) throws ResourceNotFoundException;
    void removeCarFromWishlist(String carCode, String userEmail) throws ResourceNotFoundException;
}