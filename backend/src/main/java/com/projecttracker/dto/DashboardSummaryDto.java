package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDto {
    private Map<String, Long> projectsByStatus;
    private Map<String, Long> tasksByStatus;
    private Map<String, Long> teamWorkload; // userName -> active tasks count
    private long overdueCount;
}
