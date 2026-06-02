package com.projecttracker.security;

import com.projecttracker.entity.Task;
import com.projecttracker.entity.User;
import com.projecttracker.entity.UserRole;
import com.projecttracker.repository.TaskRepository;
import com.projecttracker.repository.ProjectMemberRepository;
import com.projecttracker.service.ActivityLogService;
import com.projecttracker.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service("taskSecurity")
@RequiredArgsConstructor
public class TaskSecurityService {

    private final TaskRepository taskRepo;
    private final ProjectMemberRepository projectMemberRepo;
    private final ActivityLogService activityLogService;

    /**
     * Central method called by @PreAuthorize on every task mutation endpoint.
     * Returns true if the current user is allowed to edit the given task.
     */
    public boolean canEditTask(Long taskId, User currentUser) {
        if (currentUser == null) return false;

        // ── MANAGER: always allowed ───────────────────────────────────────
        if (currentUser.getRole() == UserRole.MANAGER) {
            return true;
        }

        // ── VIEWER: never allowed ─────────────────────────────────────────
        if (currentUser.getRole() == UserRole.VIEWER) {
            return false;
        }

        // Fetch task — throws 404 if not found (handled by GlobalExceptionHandler)
        Task task = taskRepo.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        Long projectId = task.getProject().getId();
        Long userId    = currentUser.getId();

        // ── Check user is a member of this project ────────────────────────
        boolean isMemberOfProject = projectMemberRepo
            .existsByProjectIdAndUserId(projectId, userId);

        if (!isMemberOfProject) {
            return false;   // not even in the project — hard block
        }

        // ── TEAM_LEAD: can edit any task in their projects ────────────────
        if (currentUser.getRole() == UserRole.TEAM_LEAD) {
            return true;
        }

        // ── MEMBER: can only edit tasks assigned to them ──────────────────
        if (currentUser.getRole() == UserRole.MEMBER) {
            boolean isAssignee = task.getAssignedTo() != null
                && task.getAssignedTo().getId().equals(userId);

            if (!isAssignee) {
                // Log the unauthorised attempt
                activityLogService.logActivity(
                    "TASK",
                    taskId,
                    "UNAUTHORISED_EDIT_ATTEMPT",
                    currentUser,
                    currentUser.getName() + " attempted to edit a task not assigned to them."
                );
            }
            return isAssignee;
        }

        return false;
    }

    /**
     * Check if user can VIEW a task — used on GET endpoints.
     * Any project member (including VIEWER) can view tasks in their project.
     */
    public boolean canViewTask(Long taskId, User currentUser) {
        if (currentUser == null) return false;
        if (currentUser.getRole() == UserRole.MANAGER) return true;

        Task task = taskRepo.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return projectMemberRepo.existsByProjectIdAndUserId(
            task.getProject().getId(),
            currentUser.getId()
        );
    }

    /**
     * Check if user can create tasks in a project.
     * MANAGER, TEAM_LEAD, MEMBER can create. VIEWER cannot.
     */
    public boolean canCreateTaskInProject(Long projectId, User currentUser) {
        if (currentUser == null) return false;
        if (currentUser.getRole() == UserRole.MANAGER) return true;
        if (currentUser.getRole() == UserRole.VIEWER)  return false;

        return projectMemberRepo.existsByProjectIdAndUserId(
            projectId,
            currentUser.getId()
        );
    }

    /**
     * Check if user can delete a task.
     * Only MANAGER and TEAM_LEAD (within the project) can delete.
     */
    public boolean canDeleteTask(Long taskId, User currentUser) {
        if (currentUser == null) return false;
        if (currentUser.getRole() == UserRole.MANAGER) return true;
        if (currentUser.getRole() == UserRole.VIEWER
         || currentUser.getRole() == UserRole.MEMBER) return false;

        // TEAM_LEAD — must be in the project
        Task task = taskRepo.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return projectMemberRepo.existsByProjectIdAndUserId(
            task.getProject().getId(),
            currentUser.getId()
        );
    }
}
