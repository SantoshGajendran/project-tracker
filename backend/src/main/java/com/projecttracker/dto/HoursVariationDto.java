package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoursVariationDto {
    private String currentMonth;
    private String previousMonth;
    private double currentMonthTotal;
    private double previousMonthTotal;
    private double variation;
    private double variationPercentage;
    private String trend;
    private Map<String, ProjectVariation> projectVariations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectVariation {
        private String projectName;
        private double currentMonthHours;
        private double previousMonthHours;
        private double variation;
        private double variationPercentage;
    }
}