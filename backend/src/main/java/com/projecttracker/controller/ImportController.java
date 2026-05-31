package com.projecttracker.controller;

import com.projecttracker.dto.ApiResponse;
import com.projecttracker.dto.ConfirmImportRequest;
import com.projecttracker.dto.ImportValidationReportDto;
import com.projecttracker.entity.User;
import com.projecttracker.service.ExcelTemplateService;
import com.projecttracker.service.ImportExecutionService;
import com.projecttracker.service.ImportSessionCache;
import com.projecttracker.service.ImportValidatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@CrossOrigin
public class ImportController {

    private final ExcelTemplateService excelTemplateService;
    private final ImportValidatorService importValidatorService;
    private final ImportExecutionService importExecutionService;
    private final ImportSessionCache importSessionCache;

    @GetMapping("/template/projects")
    public ResponseEntity<byte[]> downloadProjectsTemplate() throws IOException {
        byte[] data = excelTemplateService.generateProjectsTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects_template.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @GetMapping("/template/tasks")
    public ResponseEntity<byte[]> downloadTasksTemplate() throws IOException {
        byte[] data = excelTemplateService.generateTasksTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tasks_template.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @PostMapping("/validate/projects")
    public ResponseEntity<ApiResponse<ImportValidationReportDto>> validateProjects(
            @RequestParam("file") MultipartFile file) throws Exception {
        
        ImportValidationReportDto report = importValidatorService.validateProjects(file.getInputStream());
        String token = UUID.randomUUID().toString();
        importSessionCache.put(token, report.getValidRows(), "projects");
        report.setSessionToken(token);
        
        return ResponseEntity.ok(ApiResponse.success(report, "Project template validation complete."));
    }

    @PostMapping("/validate/tasks")
    public ResponseEntity<ApiResponse<ImportValidationReportDto>> validateTasks(
            @RequestParam("file") MultipartFile file) throws Exception {
        
        ImportValidationReportDto report = importValidatorService.validateTasks(file.getInputStream());
        String token = UUID.randomUUID().toString();
        importSessionCache.put(token, report.getValidRows(), "tasks");
        report.setSessionToken(token);
        
        return ResponseEntity.ok(ApiResponse.success(report, "Task template validation complete."));
    }

    @PostMapping("/confirm/projects")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmProjects(
            @RequestBody ConfirmImportRequest request,
            @AuthenticationPrincipal User user) {
        
        ImportSessionCache.CachedSession session = importSessionCache.get(request.getSessionToken());
        if (session == null || !"projects".equals(session.getType())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired session token."));
        }
        
        int count = importExecutionService.importProjects(session.getValidRows(), user);
        importSessionCache.remove(request.getSessionToken());
        
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count), count + " projects successfully imported."));
    }

    @PostMapping("/confirm/tasks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmTasks(
            @RequestBody ConfirmImportRequest request,
            @AuthenticationPrincipal User user) {
        
        ImportSessionCache.CachedSession session = importSessionCache.get(request.getSessionToken());
        if (session == null || !"tasks".equals(session.getType())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired session token."));
        }
        
        int count = importExecutionService.importTasks(session.getValidRows(), user);
        importSessionCache.remove(request.getSessionToken());
        
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count), count + " tasks successfully imported."));
    }
}
