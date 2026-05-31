package com.projecttracker.service;

import com.projecttracker.dto.RegisterRequest;
import com.projecttracker.dto.UserDto;
import com.projecttracker.dto.UserStatsDto;
import com.projecttracker.entity.ProjectMember;
import com.projecttracker.entity.ProjectStatus;
import com.projecttracker.entity.Task;
import com.projecttracker.entity.TaskStatus;
import com.projecttracker.entity.User;
import com.projecttracker.entity.UserRole;
import com.projecttracker.entity.Project;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.UserMapper;
import com.projecttracker.repository.ProjectMemberRepository;
import com.projecttracker.repository.TaskRepository;
import com.projecttracker.repository.UserRepository;
import com.projecttracker.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Reassign projects created by this user
        List<Project> createdProjects = projectRepository.findByCreatedBy(user);
        if (!createdProjects.isEmpty()) {
            User fallbackUser = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRole.MANAGER && !u.getId().equals(id))
                    .findFirst()
                    .orElseGet(() -> userRepository.findAll().stream()
                            .filter(u -> !u.getId().equals(id))
                            .findFirst()
                            .orElse(null));

            if (fallbackUser != null) {
                for (Project project : createdProjects) {
                    project.setCreatedBy(fallbackUser);
                }
                projectRepository.saveAll(createdProjects);
            }
        }

        userRepository.delete(user);
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        user.setName(userDto.getName());
        user.setAvatar(userDto.getAvatar());
        if (userDto.getRole() != null) {
            user.setRole(userDto.getRole());
        }
        
        User savedUser = userRepository.save(user);
        return userMapper.toDto(savedUser);
    }

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already taken");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    public UserStatsDto getUserStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        long tasksCompleted = taskRepository.countCompletedTasksByUserId(userId);
        
        List<ProjectMember> memberships = projectMemberRepository.findByUserId(userId);
        long activeProjects = memberships.stream()
                .map(ProjectMember::getProject)
                .filter(p -> p.getStatus() != ProjectStatus.COMPLETED && p.getStatus() != ProjectStatus.CANCELLED)
                .count();

        // Calculate story points completed
        long storyPointsDone = taskRepository.sumStoryPointsCompletedByUserId(userId);

        // Days active (days between user registration and now, min 1)
        long daysActive = Duration.between(user.getCreatedAt(), Instant.now()).toDays();
        if (daysActive <= 0) {
            daysActive = 1;
        }

        // Formula: (tasksCompleted * 10 + storyPointsDone * 2) / daysActive
        double productivityScore = (tasksCompleted * 10.0 + storyPointsDone * 2.0) / daysActive;
        
        // Round to 1 decimal place
        productivityScore = Math.round(productivityScore * 10.0) / 10.0;

        return UserStatsDto.builder()
                .tasksCompleted(tasksCompleted)
                .activeProjects(activeProjects)
                .productivityScore(productivityScore)
                .build();
    }
}
