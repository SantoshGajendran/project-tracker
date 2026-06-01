package com.projecttracker.dto;

import com.projecttracker.entity.ProjectPriority;
import com.projecttracker.entity.ProjectStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDto {
    private Long id;

    @NotBlank(message = "Project name is required")
    @Size(max = 100, message = "Project name must not exceed 100 characters")
    private String name;

    private String description;

    @NotNull(message = "Status is required")
    private ProjectStatus status;

    @NotNull(message = "Priority is required")
    private ProjectPriority priority;

    private LocalDate startDate;

    private LocalDate dueDate;

    private double progress;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean isAtRisk;
}
