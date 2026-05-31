package com.projecttracker.mapper;

import com.projecttracker.dto.CommentDto;
import com.projecttracker.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "task.id", target = "taskId")
    @Mapping(source = "author.id", target = "authorId")
    @Mapping(source = "author.name", target = "authorName")
    @Mapping(source = "author.avatar", target = "authorAvatar")
    CommentDto toDto(Comment comment);

    @Mapping(target = "task", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Comment toEntity(CommentDto dto);
}
