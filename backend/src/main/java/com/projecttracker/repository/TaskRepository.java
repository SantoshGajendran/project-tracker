package com.projecttracker.repository;

import com.projecttracker.entity.Task;
import com.projecttracker.entity.TaskPriority;
import com.projecttracker.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE " +
           "(:projectId IS NULL OR t.project.id = :projectId) AND " +
           "(:assigneeId IS NULL OR t.assignedTo.id = :assigneeId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:sprintId IS NULL OR t.sprint.id = :sprintId) AND " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Task> findTasksWithFilters(
            @Param("projectId") Long projectId,
            @Param("assigneeId") Long assigneeId,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("sprintId") Long sprintId,
            @Param("search") String search,
            Pageable pageable);

    List<Task> findByProjectId(Long projectId);
    
    List<Task> findBySprintId(Long sprintId);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, TaskStatus status);

    long countByStatus(TaskStatus status);

    long countByStatusNotAndDueDateBefore(TaskStatus status, LocalDate today);

    List<Task> findByStatusNotAndDueDateBefore(TaskStatus status, LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.dueDate = :date AND t.status != 'DONE'")
    List<Task> findTasksForUserOnDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId")
    long countTasksByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId AND t.status = 'DONE'")
    long countCompletedTasksByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.storyPoints), 0) FROM Task t WHERE t.assignedTo.id = :userId AND t.status = 'DONE'")
    long sumStoryPointsCompletedByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.storyPoints), 0) FROM Task t WHERE t.sprint.id = :sprintId AND t.status = 'DONE'")
    long sumStoryPointsCompletedBySprintId(@Param("sprintId") Long sprintId);

    @Query("SELECT COALESCE(SUM(t.storyPoints), 0) FROM Task t WHERE t.sprint.id = :sprintId")
    long sumTotalStoryPointsBySprintId(@Param("sprintId") Long sprintId);
}
