package com.projecttracker.controller;

import com.projecttracker.dto.*;
import com.projecttracker.service.TimeEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/dashboard")
@RequiredArgsConstructor
public class BillingDashboardController {

    private final TimeEntryService timeEntryService;

    @GetMapping("/weekly-hours")
    public ResponseEntity<ApiResponse<List<WeeklyHoursDto>>> getWeeklyHours(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<WeeklyHoursDto> data = timeEntryService.getWeeklyHours(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Weekly hours retrieved"));
    }

    @GetMapping("/monthly-hours")
    public ResponseEntity<ApiResponse<List<MonthlyHoursDto>>> getMonthlyHours(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<MonthlyHoursDto> data = timeEntryService.getMonthlyHours(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Monthly hours retrieved"));
    }

    @GetMapping("/hours-variation")
    public ResponseEntity<ApiResponse<HoursVariationDto>> getHoursVariation() {
        HoursVariationDto variation = timeEntryService.getHoursVariation();
        return ResponseEntity.ok(ApiResponse.success(variation, "Hours variation retrieved"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        Map<String, Object> summary = timeEntryService.getDashboardSummary(start, end);
        return ResponseEntity.ok(ApiResponse.success(summary, "Dashboard summary retrieved"));
    }
}