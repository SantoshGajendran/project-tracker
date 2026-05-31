package com.projecttracker.service;

import com.projecttracker.dto.*;
import com.projecttracker.entity.*;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.ActivityLogMapper;
import com.projecttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ActivityLogMapper activityLogMapper;
    private final UserService userService;

    public DashboardSummaryDto getSummary() {
        // Projects by status
        Map<String, Long> projectsByStatus = new HashMap<>();
        for (ProjectStatus status : ProjectStatus.values()) {
            projectsByStatus.put(status.name(), 0L);
        }
        projectRepository.findAll().forEach(p -> {
            projectsByStatus.put(p.getStatus().name(), projectsByStatus.getOrDefault(p.getStatus().name(), 0L) + 1);
        });

        // Tasks by status
        Map<String, Long> tasksByStatus = new HashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            tasksByStatus.put(status.name(), 0L);
        }
        taskRepository.findAll().forEach(t -> {
            tasksByStatus.put(t.getStatus().name(), tasksByStatus.getOrDefault(t.getStatus().name(), 0L) + 1);
        });

        // Team workload (active tasks assigned per user name)
        Map<String, Long> teamWorkload = new HashMap<>();
        List<User> users = userRepository.findAll();
        for (User u : users) {
            teamWorkload.put(u.getName(), 0L);
        }
        taskRepository.findAll().stream()
                .filter(t -> t.getAssignedTo() != null && t.getStatus() != TaskStatus.DONE)
                .forEach(t -> {
                    String name = t.getAssignedTo().getName();
                    teamWorkload.put(name, teamWorkload.getOrDefault(name, 0L) + 1);
                });

        // Overdue count
        long overdueCount = taskRepository.countByStatusNotAndDueDateBefore(TaskStatus.DONE, LocalDate.now());

        return DashboardSummaryDto.builder()
                .projectsByStatus(projectsByStatus)
                .tasksByStatus(tasksByStatus)
                .teamWorkload(teamWorkload)
                .overdueCount(overdueCount)
                .build();
    }

    public List<TeamProductivityDto> getTeamProductivity() {
        return userRepository.findAll().stream().map(user -> {
            UserStatsDto stats = userService.getUserStats(user.getId());
            long storyPoints = taskRepository.sumStoryPointsCompletedByUserId(user.getId());

            return TeamProductivityDto.builder()
                    .userId(user.getId())
                    .name(user.getName())
                    .avatar(user.getAvatar())
                    .role(user.getRole())
                    .tasksCompleted(stats.getTasksCompleted())
                    .storyPointsDone(storyPoints)
                    .productivityScore(stats.getProductivityScore())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ProjectHealthDto> getProjectHealth() {
        LocalDate today = LocalDate.now();
        return projectRepository.findAll().stream().map(p -> {
            long daysRemaining = 0;
            if (p.getDueDate() != null) {
                daysRemaining = ChronoUnit.DAYS.between(today, p.getDueDate());
            }

            boolean riskFlag = false;
            if (p.getDueDate() != null) {
                riskFlag = p.getDueDate().isBefore(today.plusDays(7)) && p.getProgress() < 50.0;
            }

            return ProjectHealthDto.builder()
                    .projectId(p.getId())
                    .name(p.getName())
                    .progress(p.getProgress())
                    .daysRemaining(daysRemaining)
                    .status(p.getStatus())
                    .priority(p.getPriority())
                    .riskFlag(riskFlag)
                    .build();
        }).collect(Collectors.toList());
    }

    public BurndownDataDto getBurndown(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with id: " + sprintId));

        List<Task> sprintTasks = taskRepository.findBySprintId(sprintId);
        int totalStoryPoints = sprintTasks.stream().mapToInt(Task::getStoryPoints).sum();

        LocalDate startDate = sprint.getStartDate();
        LocalDate endDate = sprint.getEndDate();
        LocalDate today = LocalDate.now();

        long totalDays = ChronoUnit.DAYS.between(startDate, endDate);
        if (totalDays <= 0) totalDays = 1;

        List<BurndownDataPoint> points = new ArrayList<>();
        
        for (int i = 0; i <= totalDays; i++) {
            LocalDate currentDate = startDate.plusDays(i);
            String dateStr = currentDate.toString();

            // Calculate ideal remaining: linearly decrease from total to 0
            double ideal = totalStoryPoints - (i * ((double) totalStoryPoints / totalDays));
            ideal = Math.round(ideal * 10.0) / 10.0; // round to 1 decimal
            if (ideal < 0) ideal = 0;

            Double actual = null;
            if (!currentDate.isAfter(today)) {
                // Sum story points of tasks completed after this day
                int completedSP = 0;
                for (Task t : sprintTasks) {
                    if (t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null) {
                        LocalDate compDate = LocalDate.ofInstant(t.getCompletedAt(), ZoneId.systemDefault());
                        if (!compDate.isAfter(currentDate)) {
                            completedSP += t.getStoryPoints();
                        }
                    }
                }
                actual = (double) (totalStoryPoints - completedSP);
            }

            points.add(BurndownDataPoint.builder()
                    .date(dateStr)
                    .idealRemaining(ideal)
                    .actualRemaining(actual)
                    .build());
        }

        return BurndownDataDto.builder()
                .sprintId(sprintId)
                .sprintName(sprint.getName())
                .startDate(startDate)
                .endDate(endDate)
                .totalStoryPoints(totalStoryPoints)
                .dataPoints(points)
                .build();
    }

    public List<ActivityLogDto> getActivityFeed() {
        return activityLogRepository.findTop20ByOrderByTimestampDesc().stream()
                .map(activityLogMapper::toDto)
                .collect(Collectors.toList());
    }
}
