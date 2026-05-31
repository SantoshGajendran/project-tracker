package com.projecttracker.mapper;

import com.projecttracker.dto.ActivityLogDto;
import com.projecttracker.entity.ActivityLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ActivityLogMapper {

    @Mapping(source = "performedBy.id", target = "performedById")
    @Mapping(source = "performedBy.name", target = "performedByName")
    @Mapping(source = "performedBy.avatar", target = "performedByAvatar")
    ActivityLogDto toDto(ActivityLog log);
}
