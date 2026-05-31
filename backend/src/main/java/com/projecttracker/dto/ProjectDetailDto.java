package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDetailDto {
    private ProjectDto project;
    private List<ProjectMemberDto> members;
    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long inReviewTasks;
    private long completedTasks;
}
