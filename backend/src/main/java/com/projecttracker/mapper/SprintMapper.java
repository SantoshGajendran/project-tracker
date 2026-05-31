package com.projecttracker.mapper;

import com.projecttracker.dto.SprintDto;
import com.projecttracker.entity.Sprint;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SprintMapper {

    @Mapping(source = "project.id", target = "projectId")
    SprintDto toDto(Sprint sprint);

    @Mapping(target = "project", ignore = true)
    Sprint toEntity(SprintDto dto);
}
