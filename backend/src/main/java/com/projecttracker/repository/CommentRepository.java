package com.projecttracker.repository;

import com.projecttracker.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskIdOrderByCreatedAtDesc(Long taskId);
    void deleteByAuthorId(Long authorId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.task.id IN :taskIds")
    void deleteByTaskIdIn(@Param("taskIds") List<Long> taskIds);
}
