package com.projecttracker.service;

import com.projecttracker.dto.ProjectDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.*;
import com.projecttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportExecutionService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final ActivityLogService activityLogService;
    private final ProjectService projectService;

    @Transactional
    public int importProjects(List<Object> validRows, User performer) {
        int count = 0;
        for (Object row : validRows) {
            ProjectDto dto = (ProjectDto) row;

            Project project = new Project();
            project.setName(dto.getName());
            project.setDescription(dto.getDescription());
            project.setStatus(dto.getStatus());
            project.setPriority(dto.getPriority());
            project.setStartDate(dto.getStartDate());
            project.setDueDate(dto.getDueDate());
            project.setProgress(0.0);
            project.setCreatedBy(performer);

            Project saved = projectRepository.save(project);

            // Auto-assign owner
            ProjectMember owner = ProjectMember.builder()
                    .project(saved)
                    .user(performer)
                    .role(ProjectMemberRole.OWNER)
                    .build();
            projectMemberRepository.save(owner);

            activityLogService.logActivity(
                    "Project", saved.getId(), "CREATE", performer,
                    "Project '" + saved.getName() + "' created via bulk import"
            );
            count++;
        }
        return count;
    }

    @Transactional
    public int importTasks(List<Object> validRows, User performer) {
        int count = 0;
        for (Object row : validRows) {
            TaskDto dto = (TaskDto) row;

            Project project = projectRepository.findById(dto.getProjectId()).orElse(null);
            if (project == null) continue;

            User assignee = null;
            if (dto.getAssignedToId() != null) {
                assignee = userRepository.findById(dto.getAssignedToId()).orElse(null);
            }

            Sprint sprint = null;
            if (dto.getSprintId() != null) {
                sprint = sprintRepository.findById(dto.getSprintId()).orElse(null);
            }

            Task task = new Task();
            task.setProject(project);
            task.setTitle(dto.getTitle());
            task.setDescription(dto.getDescription());
            task.setStatus(dto.getStatus());
            task.setPriority(dto.getPriority());
            task.setAssignedTo(assignee);
            task.setSprint(sprint);
            task.setDueDate(dto.getDueDate());

            Task saved = taskRepository.save(task);

            // Recalculate project progress
            projectService.recalculateProjectProgress(project.getId());

            activityLogService.logActivity(
                    "Task", saved.getId(), "CREATE", performer,
                    "Task '" + saved.getTitle() + "' created in project '" + project.getName() + "' via bulk import"
            );
            count++;
        }
        return count;
    }
}
