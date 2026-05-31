package com.projecttracker.dto;

import com.projecttracker.entity.SprintStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintDto {
    private Long id;

    @NotBlank(message = "Sprint name is required")
    @Size(max = 100, message = "Sprint name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Sprint status is required")
    private SprintStatus status;

    private String goal;
}
