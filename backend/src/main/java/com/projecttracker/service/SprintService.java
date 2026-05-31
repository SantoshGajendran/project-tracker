package com.projecttracker.service;

import com.projecttracker.dto.SprintDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.Project;
import com.projecttracker.entity.Sprint;
import com.projecttracker.entity.SprintStatus;
import com.projecttracker.entity.Task;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.entity.User;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.SprintMapper;
import com.projecttracker.mapper.TaskMapper;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.SprintRepository;
import com.projecttracker.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SprintMapper sprintMapper;
    private final TaskMapper taskMapper;
    private final ActivityLogService activityLogService;

    @Transactional
    public SprintDto createSprint(SprintDto sprintDto, User performer) {
        Project project = projectRepository.findById(sprintDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + sprintDto.getProjectId()));

        Sprint sprint = sprintMapper.toEntity(sprintDto);
        sprint.setProject(project);
        sprint.setStatus(SprintStatus.PLANNED);

        Sprint savedSprint = sprintRepository.save(sprint);

        activityLogService.logActivity(
                "Sprint", savedSprint.getId(), "CREATE", performer,
                "Sprint '" + savedSprint.getName() + "' created for project '" + project.getName() + "'"
        );

        return sprintMapper.toDto(savedSprint);
    }

    @Transactional
    public SprintDto updateSprint(Long id, SprintDto sprintDto, User performer) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        sprint.setName(sprintDto.getName());
        sprint.setStartDate(sprintDto.getStartDate());
        sprint.setEndDate(sprintDto.getEndDate());
        sprint.setGoal(sprintDto.getGoal());
        sprint.setStatus(sprintDto.getStatus());

        Sprint savedSprint = sprintRepository.save(sprint);

        activityLogService.logActivity(
                "Sprint", savedSprint.getId(), "UPDATE", performer,
                "Sprint '" + savedSprint.getName() + "' details updated"
        );

        return sprintMapper.toDto(savedSprint);
    }

    @Transactional
    public SprintDto startSprint(Long id, User performer) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        sprint.setStatus(SprintStatus.ACTIVE);
        Sprint savedSprint = sprintRepository.save(sprint);

        activityLogService.logActivity(
                "Sprint", savedSprint.getId(), "START", performer,
                "Sprint '" + savedSprint.getName() + "' started"
        );

        return sprintMapper.toDto(savedSprint);
    }

    @Transactional
    public SprintDto completeSprint(Long id, User performer) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + id));

        sprint.setStatus(SprintStatus.COMPLETED);
        Sprint savedSprint = sprintRepository.save(sprint);

        // Move remaining (non-DONE) tasks back to backlog
        List<Task> sprintTasks = taskRepository.findBySprintId(id);
        int movedTasksCount = 0;
        for (Task task : sprintTasks) {
            if (task.getStatus() != TaskStatus.DONE) {
                task.setSprint(null);
                taskRepository.save(task);
                movedTasksCount++;
            }
        }

        activityLogService.logActivity(
                "Sprint", savedSprint.getId(), "COMPLETE", performer,
                "Sprint '" + savedSprint.getName() + "' completed. Moved " + movedTasksCount + " active tasks back to backlog."
        );

        return sprintMapper.toDto(savedSprint);
    }

    public List<TaskDto> getSprintTasks(Long sprintId) {
        if (!sprintRepository.existsById(sprintId)) {
            throw new ResourceNotFoundException("Sprint not found with id: " + sprintId);
        }
        return taskRepository.findBySprintId(sprintId).stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<SprintDto> getSprintsForProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return sprintRepository.findByProjectId(projectId).stream()
                .map(sprintMapper::toDto)
                .collect(Collectors.toList());
    }
}
