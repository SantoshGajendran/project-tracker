package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogDto {
    private Long id;
    private String entityType;
    private Long entityId;
    private String action;
    private Long performedById;
    private String performedByName;
    private String performedByAvatar;
    private String description;
    private Instant timestamp;
}
