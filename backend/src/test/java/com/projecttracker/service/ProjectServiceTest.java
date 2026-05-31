package com.projecttracker.service;

import com.projecttracker.entity.Project;
import com.projecttracker.entity.ProjectPriority;
import com.projecttracker.entity.ProjectStatus;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project sampleProject;

    @BeforeEach
    void setUp() {
        sampleProject = Project.builder()
                .id(1L)
                .name("Test Project")
                .status(ProjectStatus.IN_PROGRESS)
                .priority(ProjectPriority.MEDIUM)
                .startDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .progress(0.0)
                .build();
    }

    @Test
    void testRecalculateProjectProgress() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(sampleProject));
        when(taskRepository.countByProjectId(1L)).thenReturn(4L);
        when(taskRepository.countByProjectIdAndStatus(1L, TaskStatus.DONE)).thenReturn(2L);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        projectService.recalculateProjectProgress(1L);

        assertEquals(50.0, sampleProject.getProgress());
        verify(projectRepository, times(1)).save(sampleProject);
    }
}
