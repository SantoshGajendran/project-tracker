package com.projecttracker.controller;

import com.projecttracker.dto.*;
import com.projecttracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary() {
        DashboardSummaryDto summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Dashboard summary retrieved"));
    }

    @GetMapping("/team-productivity")
    public ResponseEntity<ApiResponse<List<TeamProductivityDto>>> getTeamProductivity() {
        List<TeamProductivityDto> productivity = dashboardService.getTeamProductivity();
        return ResponseEntity.ok(ApiResponse.success(productivity, "Team productivity retrieved"));
    }

    @GetMapping("/project-health")
    public ResponseEntity<ApiResponse<List<ProjectHealthDto>>> getProjectHealth() {
        List<ProjectHealthDto> health = dashboardService.getProjectHealth();
        return ResponseEntity.ok(ApiResponse.success(health, "Project health retrieved"));
    }

    @GetMapping("/burndown/{sprintId}")
    public ResponseEntity<ApiResponse<BurndownDataDto>> getBurndown(@PathVariable Long sprintId) {
        BurndownDataDto burndown = dashboardService.getBurndown(sprintId);
        return ResponseEntity.ok(ApiResponse.success(burndown, "Burndown chart data retrieved"));
    }

    @GetMapping("/activity-feed")
    public ResponseEntity<ApiResponse<List<ActivityLogDto>>> getActivityFeed() {
        List<ActivityLogDto> feed = dashboardService.getActivityFeed();
        return ResponseEntity.ok(ApiResponse.success(feed, "Activity feed retrieved"));
    }
}
