package com.projecttracker.controller;

import com.projecttracker.dto.ApiResponse;
import com.projecttracker.dto.SprintDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.User;
import com.projecttracker.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<ApiResponse<SprintDto>> createSprint(
            @Valid @RequestBody SprintDto sprintDto,
            @AuthenticationPrincipal User user) {
        SprintDto created = sprintService.createSprint(sprintDto, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Sprint created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SprintDto>> updateSprint(
            @PathVariable Long id,
            @Valid @RequestBody SprintDto sprintDto,
            @AuthenticationPrincipal User user) {
        SprintDto updated = sprintService.updateSprint(id, sprintDto, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Sprint updated successfully"));
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<ApiResponse<SprintDto>> startSprint(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        SprintDto started = sprintService.startSprint(id, user);
        return ResponseEntity.ok(ApiResponse.success(started, "Sprint started successfully"));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SprintDto>> completeSprint(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        SprintDto completed = sprintService.completeSprint(id, user);
        return ResponseEntity.ok(ApiResponse.success(completed, "Sprint completed successfully"));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getSprintTasks(@PathVariable Long id) {
        List<TaskDto> tasks = sprintService.getSprintTasks(id);
        return ResponseEntity.ok(ApiResponse.success(tasks, "Sprint tasks retrieved"));
    }
}
