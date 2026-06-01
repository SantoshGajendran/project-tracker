package com.projecttracker.service;

import com.projecttracker.entity.*;
import com.projecttracker.repository.ProjectRepository;
import com.projecttracker.repository.SprintRepository;
import com.projecttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelTemplateService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    public byte[] generateProjectsTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet templateSheet = workbook.createSheet("Projects Template");
            XSSFSheet lookupSheet = workbook.createSheet("LookupData");
            workbook.setSheetOrder("LookupData", 1);
            workbook.setSheetVisibility(1, SheetVisibility.HIDDEN);

            // Populate static enums to LookupData
            populateLookupDataSheet(lookupSheet, List.of(), List.of(), List.of());

            // Build template sheet headers
            String[] headers = {
                    "Project Name*", "Description",
                    "Priority (LOW/MEDIUM/HIGH/CRITICAL)*",
                    "Status (PLANNING/IN_PROGRESS/ON_HOLD/COMPLETED/CANCELLED)*",
                    "Start Date (YYYY-MM-DD)", "Due Date (YYYY-MM-DD)"
            };

            Row headerRow = templateSheet.createRow(0);
            headerRow.setHeightInPoints(26);
            CellStyle headerStyle = createHeaderStyle(workbook);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create instructions row
            Row demoRow = templateSheet.createRow(1);
            demoRow.createCell(0).setCellValue("Example Project A");
            demoRow.createCell(1).setCellValue("Detailed description here");
            demoRow.createCell(2).setCellValue("MEDIUM");
            demoRow.createCell(3).setCellValue("PLANNING");
            demoRow.createCell(4).setCellValue("2026-06-01");
            demoRow.createCell(5).setCellValue("2026-12-31");

            // Setup priority validation (Col 2)
            setupFormulaDropdown(templateSheet, "LookupData!$D$2:$D$5", 2);
            // Setup project status validation (Col 3)
            setupFormulaDropdown(templateSheet, "LookupData!$E$2:$E$6", 3);

            for (int i = 0; i < headers.length; i++) {
                templateSheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    public byte[] generateTasksTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet templateSheet = workbook.createSheet("Tasks Template");
            XSSFSheet lookupSheet = workbook.createSheet("LookupData");
            workbook.setSheetOrder("LookupData", 1);
            workbook.setSheetVisibility(1, SheetVisibility.HIDDEN);

            // Fetch dynamic DB options
            List<String> projectNames = projectRepository.findAll().stream()
                    .map(Project::getName)
                    .collect(Collectors.toList());

            List<String> userEmails = userRepository.findAll().stream()
                    .map(User::getEmail)
                    .collect(Collectors.toList());

            List<String> sprintNames = sprintRepository.findAll().stream()
                    .map(Sprint::getName)
                    .collect(Collectors.toList());

            populateLookupDataSheet(lookupSheet, projectNames, userEmails, sprintNames);

            // Build headers
            String[] headers = {
                    "Project Name*", "Task Title*", "Description",
                    "Priority (LOW/MEDIUM/HIGH/CRITICAL)*",
                    "Status (TODO/IN_PROGRESS/IN_REVIEW/DONE)*",
                    "Assigned Member Email", "Sprint Name", "Due Date (YYYY-MM-DD)*"
            };

            Row headerRow = templateSheet.createRow(0);
            headerRow.setHeightInPoints(26);
            CellStyle headerStyle = createHeaderStyle(workbook);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create instructions row
            Row demoRow = templateSheet.createRow(1);
            demoRow.createCell(0).setCellValue(projectNames.isEmpty() ? "Assign to Project name from dropdown" : projectNames.get(0));
            demoRow.createCell(1).setCellValue("Task Ticket title");
            demoRow.createCell(2).setCellValue("Task details notes");
            demoRow.createCell(3).setCellValue("HIGH");
            demoRow.createCell(4).setCellValue("TODO");
            demoRow.createCell(5).setCellValue(userEmails.isEmpty() ? "unassigned" : userEmails.get(0));
            demoRow.createCell(6).setCellValue(sprintNames.isEmpty() ? "Backlog" : sprintNames.get(0));
            demoRow.createCell(7).setCellValue("2026-06-15");

            // Project dropdown validation (Col 0)
            if (!projectNames.isEmpty()) {
                setupFormulaDropdown(templateSheet, "LookupData!$A$2:$A$" + (projectNames.size() + 1), 0);
            }
            // Priority dropdown validation (Col 3)
            setupFormulaDropdown(templateSheet, "LookupData!$D$2:$D$5", 3);
            // Task status dropdown validation (Col 4)
            setupFormulaDropdown(templateSheet, "LookupData!$F$2:$F$5", 4);
            // User dropdown validation (Col 5)
            if (!userEmails.isEmpty()) {
                setupFormulaDropdown(templateSheet, "LookupData!$B$2:$B$" + (userEmails.size() + 1), 5);
            }
            // Sprint dropdown validation (Col 6)
            if (!sprintNames.isEmpty()) {
                setupFormulaDropdown(templateSheet, "LookupData!$C$2:$C$" + (sprintNames.size() + 1), 6);
            }

            for (int i = 0; i < headers.length; i++) {
                templateSheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    private void populateLookupDataSheet(XSSFSheet sheet, List<String> projects, List<String> users, List<String> sprints) {
        // Headers for lookup data
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Projects");
        header.createCell(1).setCellValue("Users");
        header.createCell(2).setCellValue("Sprints");
        header.createCell(3).setCellValue("Priority");
        header.createCell(4).setCellValue("ProjectStatus");
        header.createCell(5).setCellValue("TaskStatus");

        int maxRows = Math.max(
                Math.max(projects.size(), users.size()),
                Math.max(sprints.size(), 6) // enums take up to 6 rows
        );

        String[] priorities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};
        String[] projStatuses = {"PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"};
        String[] taskStatuses = {"TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"};

        for (int i = 0; i < maxRows; i++) {
            Row row = sheet.createRow(i + 1);
            if (i < projects.size()) row.createCell(0).setCellValue(projects.get(i));
            if (i < users.size()) row.createCell(1).setCellValue(users.get(i));
            if (i < sprints.size()) row.createCell(2).setCellValue(sprints.get(i));
            if (i < priorities.length) row.createCell(3).setCellValue(priorities[i]);
            if (i < projStatuses.length) row.createCell(4).setCellValue(projStatuses[i]);
            if (i < taskStatuses.length) row.createCell(5).setCellValue(taskStatuses[i]);
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);

        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBottomBorderColor(IndexedColors.BLUE_GREY.getIndex());
        return style;
    }

    private void setupFormulaDropdown(XSSFSheet sheet, String formula, int columnIndex) {
        XSSFDataValidationHelper validationHelper = new XSSFDataValidationHelper(sheet);
        CellRangeAddressList addressList = new CellRangeAddressList(1, 999, columnIndex, columnIndex);
        DataValidationConstraint constraint = validationHelper.createFormulaListConstraint(formula);
        DataValidation validation = validationHelper.createValidation(constraint, addressList);
        validation.setShowErrorBox(true);
        validation.setErrorStyle(DataValidation.ErrorStyle.STOP);
        validation.createErrorBox("Invalid Input", "Please select a valid option from the dropdown.");
        sheet.addValidationData(validation);
    }
}
