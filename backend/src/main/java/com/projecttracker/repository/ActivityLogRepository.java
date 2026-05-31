package com.projecttracker.repository;

import com.projecttracker.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
    List<ActivityLog> findTop20ByOrderByTimestampDesc();
    
    @Query("SELECT a FROM ActivityLog a WHERE (:projectId IS NULL OR (a.entityType = 'Project' AND a.entityId = :projectId) OR (a.entityType = 'Task' AND a.entityId IN (SELECT t.id FROM Task t WHERE t.project.id = :projectId)) OR (a.entityType = 'Sprint' AND a.entityId IN (SELECT s.id FROM Sprint s WHERE s.project.id = :projectId)))")
    Page<ActivityLog> findProjectActivity(@Param("projectId") Long projectId, Pageable pageable);
}
