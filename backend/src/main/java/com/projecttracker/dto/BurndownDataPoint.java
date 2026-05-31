package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BurndownDataPoint {
    private String date; // ISO-8601 String
    private double idealRemaining;
    private Double actualRemaining; // Nullable if in future
}
