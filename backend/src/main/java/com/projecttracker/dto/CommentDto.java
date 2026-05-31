package com.projecttracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDto {
    private Long id;
    private Long taskId;
    private Long authorId;
    private String authorName;
    private String authorAvatar;

    @NotBlank(message = "Comment content is required")
    private String content;

    private Instant createdAt;
}
