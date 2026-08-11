package com.kriliCar.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "car_images")
@Data @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class CarImage extends BaseEntity {

    @Column(nullable = false)
    private String path;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    private Integer sortOrder;
}