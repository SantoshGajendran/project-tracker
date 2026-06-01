package com.projecttracker.repository;

import com.projecttracker.entity.Project;
import com.projecttracker.entity.ProjectPriority;
import com.projecttracker.entity.ProjectStatus;
import com.projecttracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByCreatedBy(User createdBy);

    @Query("SELECT p FROM Project p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:priority IS NULL OR p.priority = :priority) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Project> findProjectsWithFilters(
            @Param("status") ProjectStatus status,
            @Param("priority") ProjectPriority priority,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT p.name FROM Project p")
    List<String> findAllProjectNames();

    boolean existsByNameIgnoreCase(String name);
}
