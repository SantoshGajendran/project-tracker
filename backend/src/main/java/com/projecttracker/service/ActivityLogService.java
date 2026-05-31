package com.projecttracker.service;

import com.projecttracker.entity.ActivityLog;
import com.projecttracker.entity.User;
import com.projecttracker.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(String entityType, Long entityId, String action, User performedBy, String description) {
        ActivityLog log = ActivityLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .description(description)
                .build();
        activityLogRepository.save(log);
    }
}
