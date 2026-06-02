package com.projecttracker.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LogHoursRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Task ID is required")
    private Long taskId;

    @NotNull(message = "Hours is required")
    @Min(value = 1, message = "Hours must be at least 1")
    @Max(value = 13, message = "Hours cannot exceed 13 per entry")
    private double hours;

    private String description;

    @NotNull(message = "Logged date is required")
    private LocalDate loggedDate;
}