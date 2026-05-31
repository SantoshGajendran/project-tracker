package com.projecttracker.mapper;

import com.projecttracker.dto.ProjectMemberDto;
import com.projecttracker.entity.ProjectMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMemberMapper {

    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.name", target = "userName")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "user.avatar", target = "userAvatar")
    ProjectMemberDto toDto(ProjectMember member);

    @Mapping(target = "project", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "joinedAt", ignore = true)
    ProjectMember toEntity(ProjectMemberDto dto);
}
