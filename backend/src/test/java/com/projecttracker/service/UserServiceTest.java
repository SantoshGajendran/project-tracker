package com.projecttracker.service;

import com.projecttracker.dto.UserDto;
import com.projecttracker.dto.UserStatsDto;
import com.projecttracker.entity.Project;
import com.projecttracker.entity.ProjectMember;
import com.projecttracker.entity.User;
import com.projecttracker.entity.UserRole;
import com.projecttracker.repository.ProjectMemberRepository;
import com.projecttracker.repository.TaskRepository;
import com.projecttracker.repository.UserRepository;
import com.projecttracker.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@test.com")
                .role(UserRole.MEMBER)
                .createdAt(Instant.now().minus(5, ChronoUnit.DAYS))
                .build();
    }

    @Test
    void testGetUserStats() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(taskRepository.countCompletedTasksByUserId(1L)).thenReturn(3L);
        when(projectMemberRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(taskRepository.sumStoryPointsCompletedByUserId(1L)).thenReturn(15L);

        UserStatsDto stats = userService.getUserStats(1L);

        assertNotNull(stats);
        assertEquals(3L, stats.getTasksCompleted());
        assertEquals(0L, stats.getActiveProjects());
        // score = (3 * 10 + 15 * 2) / 5 days active = 60 / 5 = 12.0
        assertEquals(12.0, stats.getProductivityScore());
    }
}
