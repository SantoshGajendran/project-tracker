package com.projecttracker.dto;

import com.projecttracker.entity.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberDto {
    private Long id;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String userName;
    private String userEmail;
    private String userAvatar;
    
    @NotNull(message = "Member role is required")
    private ProjectMemberRole role;
    
    private Instant joinedAt;
}
