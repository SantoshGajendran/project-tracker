package com.projecttracker.dto;

import com.projecttracker.entity.TaskPriority;
import com.projecttracker.entity.TaskStatus;
import jakarta.validation.constraints.Min;
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
public class TaskDto {
    private Long id;

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    private String description;

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;

    @Min(value = 0, message = "Story points must be non-negative")
    private int storyPoints;

    private Long assignedToId;
    private String assignedToName;
    private String assignedToAvatar;

    @NotNull(message = "Project ID is required")
    private Long projectId;
    private String projectName;

    private Long sprintId;
    private String sprintName;

    private LocalDate dueDate;
    private Instant completedAt;
    private Instant createdAt;
}
