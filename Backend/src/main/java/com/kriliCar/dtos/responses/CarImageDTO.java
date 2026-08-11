package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CarImageDTO {
    // ❌ id supprimé, ✅ code exposé (déjà généré par BaseEntity, non utilisé jusqu'ici)
    private String code;
    private String path;
    private Integer sortOrder;
}