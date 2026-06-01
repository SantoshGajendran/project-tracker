package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportValidationReportDto {
    private String sessionToken;
    @Builder.Default
    private List<Object> validRows = new ArrayList<>();
    @Builder.Default
    private List<ImportErrorDto> invalidRows = new ArrayList<>();
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
    @Builder.Default
    private Map<String, Object> summary = new HashMap<>();

    private int intrasheetDuplicatesCount;
    private int databaseDuplicatesCount;
    @Builder.Default
    private List<String> duplicateNames = new ArrayList<>();
}
