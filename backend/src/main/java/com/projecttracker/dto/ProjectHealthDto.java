package com.projecttracker.dto;

import com.projecttracker.entity.ProjectPriority;
import com.projecttracker.entity.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectHealthDto {
    private Long projectId;
    private String name;
    private double progress;
    private long daysRemaining;
    private ProjectStatus status;
    private ProjectPriority priority;
    private boolean riskFlag;
}
