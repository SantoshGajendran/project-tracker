package com.projecttracker.service;

import com.projecttracker.dto.ImportErrorDto;
import com.projecttracker.dto.ImportValidationReportDto;
import com.projecttracker.dto.ProjectDto;
import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.*;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.SprintRepository;
import com.projecttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ImportValidatorService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    public ImportValidationReportDto validateProjects(InputStream is) throws Exception {
        List<Object> validRows = new ArrayList<>();
        List<ImportErrorDto> invalidRows = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = sheet.getLastRowNum();

            for (int r = 1; r <= rowCount; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = r + 1;
                String name = getCellString(row.getCell(0));
                String desc = getCellString(row.getCell(1));
                String priorityStr = getCellString(row.getCell(2)).toUpperCase();
                String statusStr = getCellString(row.getCell(3)).toUpperCase();
                String startStr = getCellString(row.getCell(4));
                String dueStr = getCellString(row.getCell(5));

                boolean hasError = false;

                if (name.isEmpty()) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Project Name", "", "Project name is required."));
                    hasError = true;
                } else if (name.length() > 100) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Project Name", name, "Name length cannot exceed 100 chars."));
                    hasError = true;
                }

                ProjectPriority priority = null;
                try {
                    priority = ProjectPriority.valueOf(priorityStr);
                } catch (Exception e) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Priority", priorityStr, "Priority must be LOW, MEDIUM, HIGH, or CRITICAL."));
                    hasError = true;
                }

                ProjectStatus status = null;
                try {
                    status = ProjectStatus.valueOf(statusStr);
                } catch (Exception e) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Status", statusStr, "Status must be PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, or CANCELLED."));
                    hasError = true;
                }

                LocalDate startDate = parseDate(row.getCell(4), startStr);
                if (startDate == null) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Start Date", startStr, "Invalid start date format (use YYYY-MM-DD)."));
                    hasError = true;
                }

                LocalDate dueDate = parseDate(row.getCell(5), dueStr);
                if (dueDate == null) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Due Date", dueStr, "Invalid due date format (use YYYY-MM-DD)."));
                    hasError = true;
                }

                if (startDate != null && dueDate != null && dueDate.isBefore(startDate)) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Due Date", dueStr, "Due date cannot be before start date."));
                    hasError = true;
                }

                if (!hasError) {
                    ProjectDto dto = ProjectDto.builder()
                            .name(name)
                            .description(desc)
                            .priority(priority)
                            .status(status)
                            .startDate(startDate)
                            .dueDate(dueDate)
                            .progress(0.0)
                            .build();
                    validRows.add(dto);
                }
            }
        }

        // Build report summary
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalParsed", validRows.size() + invalidRows.size());
        summary.put("validCount", validRows.size());
        summary.put("invalidCount", invalidRows.size());

        return ImportValidationReportDto.builder()
                .validRows(validRows)
                .invalidRows(invalidRows)
                .warnings(warnings)
                .summary(summary)
                .build();
    }

    public ImportValidationReportDto validateTasks(InputStream is) throws Exception {
        List<Object> validRows = new ArrayList<>();
        List<ImportErrorDto> invalidRows = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Warm up caches for DB lookups
        List<Project> dbProjects = projectRepository.findAll();
        List<User> dbUsers = userRepository.findAll();
        List<Sprint> dbSprints = sprintRepository.findAll();

        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowCount = sheet.getLastRowNum();

            for (int r = 1; r <= rowCount; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = r + 1;
                String projectName = getCellString(row.getCell(0));
                String title = getCellString(row.getCell(1));
                String desc = getCellString(row.getCell(2));
                String priorityStr = getCellString(row.getCell(3)).toUpperCase();
                String statusStr = getCellString(row.getCell(4)).toUpperCase();
                String email = getCellString(row.getCell(5));
                String sprintName = getCellString(row.getCell(6));
                String dueStr = getCellString(row.getCell(7));

                boolean hasError = false;

                // 1. Resolve Project
                Project project = dbProjects.stream()
                        .filter(p -> p.getName().equalsIgnoreCase(projectName))
                        .findFirst()
                        .orElse(null);

                if (projectName.isEmpty()) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Project Name", "", "Project name is required."));
                    hasError = true;
                } else if (project == null) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Project Name", projectName, "Project not found in database."));
                    hasError = true;
                }

                // 2. Validate title
                if (title.isEmpty()) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Task Title", "", "Task title is required."));
                    hasError = true;
                } else if (title.length() > 255) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Task Title", title, "Title length cannot exceed 255 chars."));
                    hasError = true;
                }

                // 3. Validate priority
                TaskPriority priority = null;
                try {
                    priority = TaskPriority.valueOf(priorityStr);
                } catch (Exception e) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Priority", priorityStr, "Priority must be LOW, MEDIUM, HIGH, or CRITICAL."));
                    hasError = true;
                }

                // 4. Validate status
                TaskStatus status = null;
                try {
                    status = TaskStatus.valueOf(statusStr);
                } catch (Exception e) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Status", statusStr, "Status must be TODO, IN_PROGRESS, IN_REVIEW, or DONE."));
                    hasError = true;
                }

                // 5. Resolve Member Assignee
                User user = null;
                if (!email.isEmpty() && !email.equalsIgnoreCase("unassigned")) {
                    user = dbUsers.stream()
                            .filter(u -> u.getEmail().equalsIgnoreCase(email))
                            .findFirst()
                            .orElse(null);
                    if (user == null) {
                        invalidRows.add(new ImportErrorDto(rowNum, "Assigned Member Email", email, "Assignee user not found."));
                        hasError = true;
                    }
                }

                // 6. Resolve Sprint
                Sprint sprint = null;
                if (!sprintName.isEmpty() && !sprintName.equalsIgnoreCase("backlog")) {
                    sprint = dbSprints.stream()
                            .filter(s -> s.getName().equalsIgnoreCase(sprintName))
                            .findFirst()
                            .orElse(null);
                    if (sprint == null) {
                        invalidRows.add(new ImportErrorDto(rowNum, "Sprint Name", sprintName, "Sprint not found."));
                        hasError = true;
                    } else if (project != null && !sprint.getProject().getId().equals(project.getId())) {
                        warnings.add("Row " + rowNum + ": Sprint '" + sprintName + "' belongs to a different project. It will be mapped, but validation flags may trigger.");
                    }
                }

                // 7. Validate Date
                LocalDate dueDate = parseDate(row.getCell(7), dueStr);
                if (dueDate == null) {
                    invalidRows.add(new ImportErrorDto(rowNum, "Due Date", dueStr, "Invalid due date format (use YYYY-MM-DD)."));
                    hasError = true;
                }

                if (!hasError) {
                    TaskDto dto = TaskDto.builder()
                            .projectId(project != null ? project.getId() : null)
                            .projectName(projectName)
                            .title(title)
                            .description(desc)
                            .priority(priority)
                            .status(status)
                            .assignedToId(user != null ? user.getId() : null)
                            .assignedToName(user != null ? user.getName() : null)
                            .sprintId(sprint != null ? sprint.getId() : null)
                            .sprintName(sprintName)
                            .dueDate(dueDate)
                            .build();
                    validRows.add(dto);
                }
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalParsed", validRows.size() + invalidRows.size());
        summary.put("validCount", validRows.size());
        summary.put("invalidCount", invalidRows.size());

        return ImportValidationReportDto.builder()
                .validRows(validRows)
                .invalidRows(invalidRows)
                .warnings(warnings)
                .summary(summary)
                .build();
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate().toString();
            }
            return String.valueOf((long) cell.getNumericCellValue());
        } else if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return "";
    }

    private LocalDate parseDate(Cell cell, String fallbackStr) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        if (fallbackStr == null || fallbackStr.isEmpty()) return null;
        try {
            return LocalDate.parse(fallbackStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            try {
                // Try alternate format MM/dd/yyyy
                return LocalDate.parse(fallbackStr, DateTimeFormatter.ofPattern("M/d/yyyy"));
            } catch (Exception ex) {
                return null;
            }
        }
    }
}
