package com.projecttracker.service;

import com.projecttracker.dto.CommentDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.Comment;
import com.projecttracker.entity.Project;
import com.projecttracker.entity.Sprint;
import com.projecttracker.entity.Task;
import com.projecttracker.entity.TaskPriority;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.entity.User;
import com.projecttracker.entity.UserRole;
import com.projecttracker.exception.BadRequestException;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.CommentMapper;
import com.projecttracker.mapper.TaskMapper;
import com.projecttracker.repository.CommentRepository;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.SprintRepository;
import com.projecttracker.repository.TaskRepository;
import com.projecttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TaskMapper taskMapper;
    private final CommentMapper commentMapper;
    private final ProjectService projectService;
    private final ActivityLogService activityLogService;

    public Page<TaskDto> getTasks(Long projectId, Long assigneeId, TaskStatus status, TaskPriority priority, Long sprintId, String search, Pageable pageable) {
        return taskRepository.findTasksWithFilters(projectId, assigneeId, status, priority, sprintId, search, pageable)
                .map(taskMapper::toDto);
    }

    public TaskDto getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return taskMapper.toDto(task);
    }

    @Transactional
    public TaskDto createTask(TaskDto taskDto, User performer) {
        Project project = projectRepository.findById(taskDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDto.getProjectId()));

        Task task = taskMapper.toEntity(taskDto);
        task.setProject(project);

        if (taskDto.getAssignedToId() != null) {
            User assignee = userRepository.findById(taskDto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignedTo(assignee);
        }

        if (taskDto.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(taskDto.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
            task.setSprint(sprint);
        }

        if (task.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(Instant.now());
        }

        Task savedTask = taskRepository.save(task);

        projectService.recalculateProjectProgress(project.getId());

        activityLogService.logActivity(
                "Task", savedTask.getId(), "CREATE", performer,
                "Task '" + savedTask.getTitle() + "' created in project '" + project.getName() + "'"
        );

        return taskMapper.toDto(savedTask);
    }

    @Transactional
    public TaskDto updateTask(Long id, TaskDto taskDto, User performer) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        // Validate permissions
        validateTaskUpdatePermission(task, performer);

        Project project = projectRepository.findById(taskDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + taskDto.getProjectId()));

        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setPriority(taskDto.getPriority());
        task.setStoryPoints(taskDto.getStoryPoints());
        task.setDueDate(taskDto.getDueDate());
        task.setProject(project);

        // Assignee update
        if (taskDto.getAssignedToId() != null) {
            User assignee = userRepository.findById(taskDto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignedTo(assignee);
        } else {
            task.setAssignedTo(null);
        }

        // Sprint update
        if (taskDto.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(taskDto.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
            task.setSprint(sprint);
        } else {
            task.setSprint(null);
        }

        // Status update
        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = taskDto.getStatus();
        if (oldStatus != newStatus) {
            task.setStatus(newStatus);
            if (newStatus == TaskStatus.DONE) {
                task.setCompletedAt(Instant.now());
            } else {
                task.setCompletedAt(null);
            }
        }

        Task savedTask = taskRepository.save(task);

        projectService.recalculateProjectProgress(project.getId());

        activityLogService.logActivity(
                "Task", savedTask.getId(), "UPDATE", performer,
                "Task '" + savedTask.getTitle() + "' details updated"
        );

        return taskMapper.toDto(savedTask);
    }

    @Transactional
    public void deleteTask(Long id, User performer) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        Long projectId = task.getProject().getId();
        taskRepository.delete(task);

        projectService.recalculateProjectProgress(projectId);

        activityLogService.logActivity(
                "Task", id, "DELETE", performer,
                "Task '" + task.getTitle() + "' deleted"
        );
    }

    @Transactional
    public void deleteTasks(List<Long> ids, User performer) {
        if (performer.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only managers can bulk delete tasks");
        }
        List<Task> tasks = taskRepository.findAllById(ids);
        if (tasks.isEmpty()) return;

        java.util.Set<Long> projectIds = tasks.stream()
                .map(t -> t.getProject().getId())
                .collect(Collectors.toSet());

        commentRepository.deleteByTaskIdIn(ids);
        taskRepository.deleteAll(tasks);

        for (Long projectId : projectIds) {
            projectService.recalculateProjectProgress(projectId);
        }

        for (Task task : tasks) {
            activityLogService.logActivity(
                    "Task", task.getId(), "DELETE", performer,
                    "Task '" + task.getTitle() + "' deleted (Bulk)"
            );
        }
    }

    @Transactional
    public TaskDto patchStatus(Long id, TaskStatus status, User performer) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        validateTaskUpdatePermission(task, performer);

        TaskStatus oldStatus = task.getStatus();
        if (oldStatus != status) {
            task.setStatus(status);
            if (status == TaskStatus.DONE) {
                task.setCompletedAt(Instant.now());
            } else {
                task.setCompletedAt(null);
            }
            task = taskRepository.save(task);
            projectService.recalculateProjectProgress(task.getProject().getId());

            activityLogService.logActivity(
                    "Task", task.getId(), "STATUS_CHANGE", performer,
                    "Task '" + task.getTitle() + "' status changed from " + oldStatus + " to " + status
            );
        }

        return taskMapper.toDto(task);
    }

    @Transactional
    public TaskDto patchAssignee(Long id, Long assigneeId, User performer) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        validateTaskUpdatePermission(task, performer);

        User assignee = null;
        String assigneeName = "Unassigned";
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            assigneeName = assignee.getName();
        }

        task.setAssignedTo(assignee);
        task = taskRepository.save(task);

        activityLogService.logActivity(
                "Task", task.getId(), "REASSIGN", performer,
                "Task '" + task.getTitle() + "' reassigned to " + assigneeName
        );

        return taskMapper.toDto(task);
    }

    public List<TaskDto> getMyTasks(User user) {
        return taskRepository.findTasksWithFilters(null, user.getId(), null, null, null, null, null).getContent()
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getOverdueTasks() {
        return taskRepository.findByStatusNotAndDueDateBefore(TaskStatus.DONE, LocalDate.now())
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto addComment(Long taskId, CommentDto commentDto, User author) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        Comment comment = Comment.builder()
                .task(task)
                .author(author)
                .content(commentDto.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);

        activityLogService.logActivity(
                "Task", taskId, "ADD_COMMENT", author,
                "Added comment on task '" + task.getTitle() + "'"
        );

        return commentMapper.toDto(savedComment);
    }

    public List<CommentDto> getCommentsForTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }
        return commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(commentMapper::toDto)
                .collect(Collectors.toList());
    }

    private void validateTaskUpdatePermission(Task task, User performer) {
        // MEMBER role can only update tasks assigned to them
        if (performer.getRole() == UserRole.MEMBER) {
            if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(performer.getId())) {
                throw new AccessDeniedException("You can only update tasks assigned to you.");
            }
        }
    }
}
