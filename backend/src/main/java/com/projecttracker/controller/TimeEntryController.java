package com.projecttracker.controller;

import com.projecttracker.dto.ApiResponse;
import com.projecttracker.dto.LogHoursRequest;
import com.projecttracker.dto.TimeEntryDto;
import com.projecttracker.entity.User;
import com.projecttracker.service.TimeEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/time-entries")
@RequiredArgsConstructor
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TimeEntryDto>>> getTimeEntries(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {

        if (startDate == null) startDate = LocalDate.now().minusMonths(1);
        if (endDate == null) endDate = LocalDate.now();

        Page<TimeEntryDto> entries = timeEntryService.getTimeEntries(projectId, taskId, userId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(entries, "Time entries retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeEntryDto>> getTimeEntryById(@PathVariable Long id) {
        TimeEntryDto entry = timeEntryService.getTimeEntryById(id);
        return ResponseEntity.ok(ApiResponse.success(entry, "Time entry retrieved"));
    }

    @GetMapping("/tasks/{taskId}/total-hours")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalHoursForTask(@PathVariable Long taskId) {
        double totalHours = timeEntryService.getTotalHoursForTask(taskId);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("taskId", taskId, "totalHours", totalHours),
                "Total hours for task retrieved"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimeEntryDto>> createTimeEntry(
            @Valid @RequestBody LogHoursRequest request,
            @AuthenticationPrincipal User user) {
        TimeEntryDto created = timeEntryService.createTimeEntry(request, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Time entry created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeEntryDto>> updateTimeEntry(
            @PathVariable Long id,
            @Valid @RequestBody LogHoursRequest request,
            @AuthenticationPrincipal User user) {
        TimeEntryDto updated = timeEntryService.updateTimeEntry(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Time entry updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimeEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        timeEntryService.deleteTimeEntry(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Time entry deleted successfully"));
    }
}