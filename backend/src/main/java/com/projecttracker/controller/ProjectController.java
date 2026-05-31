package com.projecttracker.controller;

import com.projecttracker.dto.*;
import com.projecttracker.entity.*;
import com.projecttracker.repository.ActivityLogRepository;
import com.projecttracker.service.ProjectService;
import com.projecttracker.service.SprintService;
import com.projecttracker.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final TaskService taskService;
    private final SprintService sprintService;
    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getProjects(
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) ProjectPriority priority,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        
        Page<ProjectDto> projects = projectService.getProjects(status, priority, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(projects, "Projects retrieved"));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @Valid @RequestBody ProjectDto projectDto,
            @AuthenticationPrincipal User user) {
        
        ProjectDto created = projectService.createProject(projectDto, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Project created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> getProjectDetails(@PathVariable Long id) {
        ProjectDetailDto detail = projectService.getProjectDetails(id);
        return ResponseEntity.ok(ApiResponse.success(detail, "Project details retrieved"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDto projectDto,
            @AuthenticationPrincipal User user) {
        
        ProjectDto updated = projectService.updateProject(id, projectDto, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Project updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        projectService.deleteProject(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberDto>>> getProjectMembers(@PathVariable Long id) {
        List<ProjectMemberDto> members = projectService.getProjectMembers(id);
        return ResponseEntity.ok(ApiResponse.success(members, "Project members retrieved"));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMemberDto>> assignMember(
            @PathVariable Long id,
            @Valid @RequestBody ProjectMemberDto memberDto,
            @AuthenticationPrincipal User user) {
        
        ProjectMemberDto assigned = projectService.assignMember(id, memberDto, user);
        return ResponseEntity.ok(ApiResponse.success(assigned, "Member assigned successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        
        projectService.removeMember(id, userId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<ApiResponse<Page<TaskDto>>> getProjectTasks(
            @PathVariable Long id,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<TaskDto> tasks = taskService.getTasks(id, null, status, priority, sprintId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(tasks, "Project tasks retrieved"));
    }

    @GetMapping("/{id}/sprints")
    public ResponseEntity<ApiResponse<List<SprintDto>>> getProjectSprints(@PathVariable Long id) {
        List<SprintDto> sprints = sprintService.getSprintsForProject(id);
        return ResponseEntity.ok(ApiResponse.success(sprints, "Project sprints retrieved"));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<Page<ActivityLogDto>>> getProjectActivity(
            @PathVariable Long id,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<ActivityLogDto> logs = activityLogRepository.findProjectActivity(id, pageable)
                .map(log -> ActivityLogDto.builder()
                        .id(log.getId())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .action(log.getAction())
                        .performedById(log.getPerformedBy() != null ? log.getPerformedBy().getId() : null)
                        .performedByName(log.getPerformedBy() != null ? log.getPerformedBy().getName() : null)
                        .performedByAvatar(log.getPerformedBy() != null ? log.getPerformedBy().getAvatar() : null)
                        .description(log.getDescription())
                        .timestamp(log.getTimestamp())
                        .build());
        return ResponseEntity.ok(ApiResponse.success(logs, "Project activity logs retrieved"));
    }
}
