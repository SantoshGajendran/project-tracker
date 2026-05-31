package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BurndownDataDto {
    private Long sprintId;
    private String sprintName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalStoryPoints;
    private List<BurndownDataPoint> dataPoints;
}
