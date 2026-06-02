package com.projecttracker.controller;

import com.projecttracker.dto.ApiResponse;
import com.projecttracker.dto.CommentDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.TaskPriority;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.entity.User;
import com.projecttracker.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TaskDto>>> getTasks(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Page<TaskDto> tasks = taskService.getTasks(projectId, assigneeId, status, priority, sprintId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(tasks, "Tasks retrieved"));
    }

    @PostMapping
    @PreAuthorize("@taskSecurity.canCreateTaskInProject(#taskDto.projectId, principal)")
    public ResponseEntity<ApiResponse<TaskDto>> createTask(
            @Valid @RequestBody TaskDto taskDto,
            @AuthenticationPrincipal User user) {
        
        TaskDto created = taskService.createTask(taskDto, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Task created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@taskSecurity.canViewTask(#id, principal)")
    public ResponseEntity<ApiResponse<TaskDto>> getTaskById(@PathVariable Long id) {
        TaskDto task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success(task, "Task retrieved"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@taskSecurity.canEditTask(#id, principal)")
    public ResponseEntity<ApiResponse<TaskDto>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDto taskDto,
            @AuthenticationPrincipal User user) {
        
        TaskDto updated = taskService.updateTask(id, taskDto, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@taskSecurity.canDeleteTask(#id, principal)")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        taskService.deleteTask(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Task deleted successfully"));
    }

    @DeleteMapping("/bulk")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTasks(
            @RequestParam("ids") List<Long> ids,
            @AuthenticationPrincipal User user) {
        taskService.deleteTasks(ids, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Tasks deleted successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@taskSecurity.canEditTask(#id, principal)")
    public ResponseEntity<ApiResponse<TaskDto>> patchStatus(
            @PathVariable Long id,
            @RequestParam TaskStatus status,
            @AuthenticationPrincipal User user) {
        
        TaskDto updated = taskService.patchStatus(id, status, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task status updated"));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'TEAM_LEAD') and @taskSecurity.canEditTask(#id, principal)")
    public ResponseEntity<ApiResponse<TaskDto>> patchAssignee(
            @PathVariable Long id,
            @RequestParam(required = false) Long assigneeId,
            @AuthenticationPrincipal User user) {
        
        TaskDto updated = taskService.patchAssignee(id, assigneeId, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task assignee updated"));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getMyTasks(@AuthenticationPrincipal User user) {
        List<TaskDto> tasks = taskService.getMyTasks(user);
        return ResponseEntity.ok(ApiResponse.success(tasks, "User tasks retrieved"));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getOverdueTasks() {
        List<TaskDto> tasks = taskService.getOverdueTasks();
        return ResponseEntity.ok(ApiResponse.success(tasks, "Overdue tasks retrieved"));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("@taskSecurity.canViewTask(#id, principal)")
    public ResponseEntity<ApiResponse<CommentDto>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentDto commentDto,
            @AuthenticationPrincipal User user) {
        
        CommentDto created = taskService.addComment(id, commentDto, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Comment added successfully"));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getCommentsForTask(@PathVariable Long id) {
        List<CommentDto> comments = taskService.getCommentsForTask(id);
        return ResponseEntity.ok(ApiResponse.success(comments, "Task comments retrieved"));
    }
}
