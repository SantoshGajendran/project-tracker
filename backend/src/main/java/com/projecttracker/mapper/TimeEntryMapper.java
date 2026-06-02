package com.projecttracker.mapper;

import com.projecttracker.dto.TimeEntryDto;
import com.projecttracker.entity.TimeEntry;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TimeEntryMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.name", target = "userName")
    @Mapping(source = "user.avatar", target = "userAvatar")
    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "project.name", target = "projectName")
    @Mapping(source = "task.id", target = "taskId")
    @Mapping(source = "task.title", target = "taskTitle")
    TimeEntryDto toDto(TimeEntry entry);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "project", ignore = true)
    @Mapping(target = "task", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TimeEntry toEntity(com.projecttracker.dto.LogHoursRequest request);
}