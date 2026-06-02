package com.projecttracker.repository;

import com.projecttracker.entity.TimeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    List<TimeEntry> findByTaskId(Long taskId);

    Page<TimeEntry> findByUserIdAndLoggedDateBetween(Long userId, LocalDate start, LocalDate end, Pageable pageable);

    Page<TimeEntry> findByProjectIdAndLoggedDateBetween(Long projectId, LocalDate start, LocalDate end, Pageable pageable);

    Page<TimeEntry> findByLoggedDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM TimeEntry t WHERE t.task.id = :taskId")
    double sumHoursByTaskId(@Param("taskId") Long taskId);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM TimeEntry t WHERE t.loggedDate BETWEEN :start AND :end")
    double sumHoursBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT FUNCTION('date_trunc', 'week', t.loggedDate) as week, t.project.name as project, SUM(t.hours) " +
           "FROM TimeEntry t WHERE t.loggedDate BETWEEN :start AND :end " +
           "GROUP BY week, t.project.name ORDER BY week, t.project.name")
    List<Object[]> sumHoursPerWeekByProject(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT FUNCTION('date_trunc', 'month', t.loggedDate) as month, t.project.name as project, SUM(t.hours) " +
           "FROM TimeEntry t WHERE t.loggedDate BETWEEN :start AND :end " +
           "GROUP BY month, t.project.name ORDER BY month, t.project.name")
    List<Object[]> sumHoursPerMonthByProject(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM TimeEntry t WHERE " +
           "t.loggedDate BETWEEN :start AND :end")
    double sumHoursByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT t.project.name as project, COALESCE(SUM(t.hours), 0) as hours " +
           "FROM TimeEntry t WHERE t.loggedDate BETWEEN :start AND :end " +
           "GROUP BY t.project.name ORDER BY hours DESC")
    List<Object[]> sumHoursByProjectInRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}