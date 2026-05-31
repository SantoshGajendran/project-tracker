package com.projecttracker.service;

import com.projecttracker.dto.ProjectDetailDto;
import com.projecttracker.dto.ProjectDto;
import com.projecttracker.dto.ProjectMemberDto;
import com.projecttracker.entity.Project;
import com.projecttracker.entity.ProjectMember;
import com.projecttracker.entity.ProjectMemberRole;
import com.projecttracker.entity.ProjectPriority;
import com.projecttracker.entity.ProjectStatus;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.entity.User;
import com.projecttracker.exception.BadRequestException;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.ProjectMapper;
import com.projecttracker.mapper.ProjectMemberMapper;
import com.projecttracker.repository.ProjectMemberRepository;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.TaskRepository;
import com.projecttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final ProjectMemberMapper projectMemberMapper;
    private final ActivityLogService activityLogService;

    public Page<ProjectDto> getProjects(ProjectStatus status, ProjectPriority priority, String search, Pageable pageable) {
        return projectRepository.findProjectsWithFilters(status, priority, search, pageable)
                .map(projectMapper::toDto);
    }

    @Transactional
    public ProjectDto createProject(ProjectDto projectDto, User creator) {
        Project project = projectMapper.toEntity(projectDto);
        project.setCreatedBy(creator);
        project.setProgress(0.0);
        
        Project savedProject = projectRepository.save(project);

        // Auto-assign creator as OWNER
        ProjectMember owner = ProjectMember.builder()
                .project(savedProject)
                .user(creator)
                .role(ProjectMemberRole.OWNER)
                .build();
        projectMemberRepository.save(owner);

        activityLogService.logActivity(
                "Project", savedProject.getId(), "CREATE", creator,
                "Project '" + savedProject.getName() + "' created and owner assigned"
        );

        return projectMapper.toDto(savedProject);
    }

    public ProjectDetailDto getProjectDetails(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        List<ProjectMemberDto> members = projectMemberRepository.findByProjectId(id).stream()
                .map(projectMemberMapper::toDto)
                .collect(Collectors.toList());

        long totalTasks = taskRepository.countByProjectId(id);
        long todoTasks = taskRepository.countByProjectIdAndStatus(id, TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByProjectIdAndStatus(id, TaskStatus.IN_PROGRESS);
        long inReviewTasks = taskRepository.countByProjectIdAndStatus(id, TaskStatus.IN_REVIEW);
        long completedTasks = taskRepository.countByProjectIdAndStatus(id, TaskStatus.DONE);

        return ProjectDetailDto.builder()
                .project(projectMapper.toDto(project))
                .members(members)
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .inReviewTasks(inReviewTasks)
                .completedTasks(completedTasks)
                .build();
    }

    @Transactional
    public ProjectDto updateProject(Long id, ProjectDto projectDto, User performer) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        project.setStatus(projectDto.getStatus());
        project.setPriority(projectDto.getPriority());
        project.setStartDate(projectDto.getStartDate());
        project.setDueDate(projectDto.getDueDate());

        Project savedProject = projectRepository.save(project);

        activityLogService.logActivity(
                "Project", savedProject.getId(), "UPDATE", performer,
                "Project '" + savedProject.getName() + "' details updated"
        );

        return projectMapper.toDto(savedProject);
    }

    @Transactional
    public void deleteProject(Long id, User performer) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        projectRepository.delete(project);

        activityLogService.logActivity(
                "Project", id, "DELETE", performer,
                "Project '" + project.getName() + "' deleted"
        );
    }

    @Transactional
    public void recalculateProjectProgress(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        long totalTasks = taskRepository.countByProjectId(projectId);
        if (totalTasks == 0) {
            project.setProgress(0.0);
        } else {
            long completedTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);
            double progress = ((double) completedTasks / totalTasks) * 100.0;
            // Round to 2 decimal places
            progress = Math.round(progress * 100.0) / 100.0;
            project.setProgress(progress);
        }

        projectRepository.save(project);
    }

    public List<ProjectMemberDto> getProjectMembers(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(projectMemberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMemberDto assignMember(Long projectId, ProjectMemberDto dto, User performer) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, dto.getUserId())) {
            throw new BadRequestException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(dto.getRole())
                .build();

        ProjectMember savedMember = projectMemberRepository.save(member);

        activityLogService.logActivity(
                "Project", projectId, "MEMBER_ASSIGN", performer,
                "Assigned member " + user.getName() + " to project as " + dto.getRole()
        );

        return projectMemberMapper.toDto(savedMember);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User performer) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member relationship not found"));

        if (member.getRole() == ProjectMemberRole.OWNER) {
            throw new BadRequestException("Cannot remove the project OWNER");
        }

        projectMemberRepository.delete(member);

        activityLogService.logActivity(
                "Project", projectId, "MEMBER_REMOVE", performer,
                "Removed member " + member.getUser().getName() + " from project"
        );
    }
}
