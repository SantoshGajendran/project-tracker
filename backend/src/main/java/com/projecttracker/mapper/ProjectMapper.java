package com.projecttracker.mapper;

import com.projecttracker.dto.ProjectDto;
import com.projecttracker.entity.Project;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDate;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(source = "createdBy.id", target = "createdById")
    @Mapping(source = "createdBy.name", target = "createdByName")
    @Mapping(target = "isAtRisk", source = "project", qualifiedByName = "calculateIsAtRisk")
    ProjectDto toDto(Project project);

    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Project toEntity(ProjectDto dto);

    @Named("calculateIsAtRisk")
    default boolean calculateIsAtRisk(Project project) {
        if (project.getDueDate() == null) {
            return false;
        }
        return project.getDueDate().isBefore(LocalDate.now().plusDays(7)) && project.getProgress() < 50.0;
    }
}
