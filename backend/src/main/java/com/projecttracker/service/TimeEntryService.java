package com.projecttracker.service;

import com.projecttracker.dto.*;
import com.projecttracker.entity.*;
import com.projecttracker.exception.BadRequestException;
import com.projecttracker.exception.ResourceNotFoundException;
import com.projecttracker.mapper.TimeEntryMapper;
import com.projecttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TimeEntryMapper timeEntryMapper;
    private final ActivityLogService activityLogService;
    private final ProjectService projectService;

    public Page<TimeEntryDto> getTimeEntries(Long projectId, Long taskId, Long userId,
                                              LocalDate startDate, LocalDate endDate,
                                              Pageable pageable) {
        Page<TimeEntry> entries;
        if (userId != null) {
            entries = timeEntryRepository.findByUserIdAndLoggedDateBetween(userId, startDate, endDate, pageable);
        } else if (projectId != null) {
            entries = timeEntryRepository.findByProjectIdAndLoggedDateBetween(projectId, startDate, endDate, pageable);
        } else {
            entries = timeEntryRepository.findByLoggedDateBetween(startDate, endDate, pageable);
        }
        return entries.map(timeEntryMapper::toDto);
    }

    public TimeEntryDto getTimeEntryById(Long id) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with id: " + id));
        return timeEntryMapper.toDto(entry);
    }

    public double getTotalHoursForTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }
        return timeEntryRepository.sumHoursByTaskId(taskId);
    }

    @Transactional
    public TimeEntryDto createTimeEntry(LogHoursRequest request, User performer) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + request.getTaskId()));

        // Validate that the task belongs to the specified project
        if (!task.getProject().getId().equals(project.getId())) {
            throw new BadRequestException("Task does not belong to the specified project");
        }

        // Check cumulative hours for this task (max 13)
        double currentTotal = timeEntryRepository.sumHoursByTaskId(task.getId());
        if (currentTotal + request.getHours() > 13.0) {
            double remaining = 13.0 - currentTotal;
            throw new BadRequestException(
                    String.format("Task '%s' cannot exceed 13 total billable hours. Already logged: %.1f hours. Remaining: %.1f hours.",
                            task.getTitle(), currentTotal, Math.max(0, remaining))
            );
        }

        TimeEntry entry = timeEntryMapper.toEntity(request);
        entry.setUser(performer);
        entry.setProject(project);
        entry.setTask(task);

        TimeEntry savedEntry = timeEntryRepository.save(entry);

        activityLogService.logActivity(
                "TimeEntry", savedEntry.getId(), "CREATE", performer,
                String.format("Logged %.1f hours on task '%s' in project '%s'", request.getHours(), task.getTitle(), project.getName())
        );

        return timeEntryMapper.toDto(savedEntry);
    }

    @Transactional
    public TimeEntryDto updateTimeEntry(Long id, LogHoursRequest request, User performer) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with id: " + id));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + request.getTaskId()));

        // Calculate total hours excluding this entry's current hours
        double otherEntriesTotal = timeEntryRepository.sumHoursByTaskId(task.getId()) - entry.getHours();
        if (otherEntriesTotal + request.getHours() > 13.0) {
            double remaining = 13.0 - otherEntriesTotal;
            throw new BadRequestException(
                    String.format("Task '%s' cannot exceed 13 total billable hours. Remaining capacity: %.1f hours.",
                            task.getTitle(), Math.max(0, remaining))
            );
        }

        entry.setProject(project);
        entry.setTask(task);
        entry.setHours(request.getHours());
        entry.setDescription(request.getDescription());
        entry.setLoggedDate(request.getLoggedDate());

        TimeEntry savedEntry = timeEntryRepository.save(entry);

        activityLogService.logActivity(
                "TimeEntry", savedEntry.getId(), "UPDATE", performer,
                String.format("Updated time entry: %.1f hours on task '%s'", request.getHours(), task.getTitle())
        );

        return timeEntryMapper.toDto(savedEntry);
    }

    @Transactional
    public void deleteTimeEntry(Long id, User performer) {
        TimeEntry entry = timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Time entry not found with id: " + id));

        timeEntryRepository.delete(entry);

        activityLogService.logActivity(
                "TimeEntry", id, "DELETE", performer,
                String.format("Deleted time entry: %.1f hours on task '%s'", entry.getHours(),
                        entry.getTask() != null ? entry.getTask().getTitle() : "unknown task")
        );
    }

    // ==================== BILLING DASHBOARD AGGREGATIONS ====================

    public List<WeeklyHoursDto> getWeeklyHours(LocalDate start, LocalDate end) {
        List<Object[]> rawData = timeEntryRepository.sumHoursPerWeekByProject(start, end);
        return aggregateTimeSeries(rawData, "week");
    }

    public List<MonthlyHoursDto> getMonthlyHours(LocalDate start, LocalDate end) {
        List<Object[]> rawData = timeEntryRepository.sumHoursPerMonthByProject(start, end);
        List<Object[]> mappedData = rawData.stream()
                .map(row -> {
                    // date_trunc('month', date) returns a timestamp; extract as LocalDate
                    java.sql.Timestamp ts = (java.sql.Timestamp) row[0];
                    String projectName = (String) row[1];
                    double hours = ((Number) row[2]).doubleValue();
                    return new Object[]{ts.toLocalDateTime().toLocalDate(), projectName, hours};
                })
                .collect(Collectors.toList());
        return aggregateTimeSeriesObject(mappedData, "month");
    }

    public HoursVariationDto getHoursVariation() {
        LocalDate today = LocalDate.now();
        YearMonth currentYearMonth = YearMonth.from(today);
        YearMonth previousYearMonth = currentYearMonth.minusMonths(1);

        LocalDate currentMonthStart = currentYearMonth.atDay(1);
        LocalDate currentMonthEnd = currentYearMonth.atEndOfMonth();
        LocalDate previousMonthStart = previousYearMonth.atDay(1);
        LocalDate previousMonthEnd = previousYearMonth.atEndOfMonth();

        double currentMonthTotal = timeEntryRepository.sumHoursByDateRange(currentMonthStart, currentMonthEnd);
        double previousMonthTotal = timeEntryRepository.sumHoursByDateRange(previousMonthStart, previousMonthEnd);

        double variation = currentMonthTotal - previousMonthTotal;
        double variationPercentage = previousMonthTotal > 0
                ? Math.round((variation / previousMonthTotal) * 100.0 * 10.0) / 10.0
                : (currentMonthTotal > 0 ? 100.0 : 0.0);

        String trend = variation > 0 ? "UP" : (variation < 0 ? "DOWN" : "FLAT");

        // Project-wise breakdown
        Map<String, HoursVariationDto.ProjectVariation> projectVariations = new HashMap<>();

        List<Object[]> currentProjectHours = timeEntryRepository.sumHoursByProjectInRange(currentMonthStart, currentMonthEnd);
        List<Object[]> previousProjectHours = timeEntryRepository.sumHoursByProjectInRange(previousMonthStart, previousMonthEnd);

        Map<String, Double> currentMap = new HashMap<>();
        for (Object[] row : currentProjectHours) {
            currentMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        Map<String, Double> previousMap = new HashMap<>();
        for (Object[] row : previousProjectHours) {
            previousMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        Set<String> allProjects = new HashSet<>();
        allProjects.addAll(currentMap.keySet());
        allProjects.addAll(previousMap.keySet());

        for (String project : allProjects) {
            double curr = currentMap.getOrDefault(project, 0.0);
            double prev = previousMap.getOrDefault(project, 0.0);
            double projVar = curr - prev;
            double projVarPct = prev > 0 ? Math.round((projVar / prev) * 100.0 * 10.0) / 10.0 : (curr > 0 ? 100.0 : 0.0);

            projectVariations.put(project, HoursVariationDto.ProjectVariation.builder()
                    .projectName(project)
                    .currentMonthHours(curr)
                    .previousMonthHours(prev)
                    .variation(projVar)
                    .variationPercentage(projVarPct)
                    .build());
        }

        return HoursVariationDto.builder()
                .currentMonth(currentYearMonth.toString())
                .previousMonth(previousYearMonth.toString())
                .currentMonthTotal(Math.round(currentMonthTotal * 10.0) / 10.0)
                .previousMonthTotal(Math.round(previousMonthTotal * 10.0) / 10.0)
                .variation(Math.round(variation * 10.0) / 10.0)
                .variationPercentage(variationPercentage)
                .trend(trend)
                .projectVariations(projectVariations)
                .build();
    }

    public Map<String, Object> getDashboardSummary(LocalDate start, LocalDate end) {
        double totalHours = timeEntryRepository.sumHoursByDateRange(start, end);
        List<Object[]> projectBreakdown = timeEntryRepository.sumHoursByProjectInRange(start, end);

        List<Map<String, Object>> projectData = new ArrayList<>();
        for (Object[] row : projectBreakdown) {
            Map<String, Object> item = new HashMap<>();
            item.put("projectName", row[0]);
            item.put("hours", ((Number) row[1]).doubleValue());
            projectData.add(item);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalHours", Math.round(totalHours * 10.0) / 10.0);
        summary.put("projectBreakdown", projectData);
        summary.put("periodStart", start.toString());
        summary.put("periodEnd", end.toString());
        return summary;
    }

    // ==================== PRIVATE HELPERS ====================

    private List<WeeklyHoursDto> aggregateTimeSeries(List<Object[]> rawData, String type) {
        Map<String, Map<String, Double>> periodMap = new LinkedHashMap<>();

        for (Object[] row : rawData) {
            String periodKey;
            if ("week".equals(type)) {
                java.sql.Timestamp ts = (java.sql.Timestamp) row[0];
                LocalDate weekStart = ts.toLocalDateTime().toLocalDate();
                periodKey = weekStart.format(DateTimeFormatter.ISO_LOCAL_DATE);
            } else {
                periodKey = row[0].toString();
            }
            String projectName = (String) row[1];
            double hours = ((Number) row[2]).doubleValue();

            periodMap.computeIfAbsent(periodKey, k -> new HashMap<>());
            periodMap.get(periodKey).merge(projectName, hours, Double::sum);
        }

        List<WeeklyHoursDto> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Double>> entry : periodMap.entrySet()) {
            double total = entry.getValue().values().stream().mapToDouble(Double::doubleValue).sum();
            result.add(WeeklyHoursDto.builder()
                    .weekStart(entry.getKey())
                    .totalHours(Math.round(total * 10.0) / 10.0)
                    .projectHours(entry.getValue())
                    .build());
        }
        return result;
    }

    private List<MonthlyHoursDto> aggregateTimeSeriesObject(List<Object[]> rawData, String type) {
        Map<String, Map<String, Double>> periodMap = new LinkedHashMap<>();

        for (Object[] row : rawData) {
            LocalDate date = (LocalDate) row[0];
            String projectName = (String) row[1];
            double hours = ((Number) row[2]).doubleValue();
            String periodKey = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));

            periodMap.computeIfAbsent(periodKey, k -> new HashMap<>());
            periodMap.get(periodKey).merge(projectName, hours, Double::sum);
        }

        List<MonthlyHoursDto> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Double>> entry : periodMap.entrySet()) {
            double total = entry.getValue().values().stream().mapToDouble(Double::doubleValue).sum();
            MonthlyHoursDto dto = MonthlyHoursDto.builder()
                    .month(entry.getKey())
                    .totalHours(Math.round(total * 10.0) / 10.0)
                    .projectHours(entry.getValue())
                    .build();
            result.add(dto);
        }
        return result;
    }
}