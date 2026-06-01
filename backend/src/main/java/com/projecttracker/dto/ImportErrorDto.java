package com.projecttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportErrorDto {
    private int rowNumber;
    private String columnName;
    private String value;
    private String errorMessage;
    private ImportErrorType errorType;

    public ImportErrorDto(int rowNumber, String columnName, String value, String errorMessage) {
        this.rowNumber = rowNumber;
        this.columnName = columnName;
        this.value = value;
        this.errorMessage = errorMessage;
        this.errorType = ImportErrorType.VALIDATION_ERROR;
    }
}

