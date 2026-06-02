package com.projecttracker.dto;

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
public class TimeEntryDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long projectId;
    private String projectName;
    private Long taskId;
    private String taskTitle;
    private double hours;
    private String description;
    private LocalDate loggedDate;
    private Instant createdAt;
    private Instant updatedAt;
}