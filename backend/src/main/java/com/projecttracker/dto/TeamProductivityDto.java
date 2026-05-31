package com.projecttracker.dto;

import com.projecttracker.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProductivityDto {
    private Long userId;
    private String name;
    private String avatar;
    private UserRole role;
    private long tasksCompleted;
    private long storyPointsDone;
    private double productivityScore;
}
