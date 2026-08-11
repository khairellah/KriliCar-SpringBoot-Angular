package com.kriliCar.entities;

import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.CarColor;
import com.kriliCar.enums.FuelType;
import com.kriliCar.enums.Gearbox;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Table(name = "cars")
@Data @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Car extends BaseEntity {

    @Column(unique = true, nullable = false, length = 17)
    private String vin;

    private Integer year;
    private Integer mileage;

    @Enumerated(EnumType.STRING)
    private Gearbox gearbox;

    @Enumerated(EnumType.STRING)
    private FuelType fuelType;

    @Enumerated(EnumType.STRING)
    private CarColor color;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer nbrSeats;
    private Double price;

    @Enumerated(EnumType.STRING)
    private CarAvailability availability = CarAvailability.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private Model model;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CarImage> images;
}