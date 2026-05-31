package com.projecttracker.mapper;

import com.projecttracker.dto.TaskDto;
import com.projecttracker.entity.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(source = "assignedTo.id", target = "assignedToId")
    @Mapping(source = "assignedTo.name", target = "assignedToName")
    @Mapping(source = "assignedTo.avatar", target = "assignedToAvatar")
    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "project.name", target = "projectName")
    @Mapping(source = "sprint.id", target = "sprintId")
    @Mapping(source = "sprint.name", target = "sprintName")
    TaskDto toDto(Task task);

    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "project", ignore = true)
    @Mapping(target = "sprint", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Task toEntity(TaskDto dto);
}
