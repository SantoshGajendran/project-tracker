import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

export interface ImportError {
  rowNumber: number;
  columnName: string;
  value: string;
  errorMessage: string;
  errorType: string;
}

export interface ImportValidationReport {
  sessionToken: string;
  validRows: any[];
  invalidRows: ImportError[];
  warnings: string[];
  summary: {
    totalParsed: number;
    validCount: number;
    invalidCount: number;
  };
  intrasheetDuplicatesCount: number;
  databaseDuplicatesCount: number;
  duplicateNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SheetLoadService {
  private apiUrl = `${environment.apiUrl}/import`;

  constructor(private http: HttpClient) {}

  downloadTemplate(type: 'projects' | 'tasks'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/template/${type}`, { responseType: 'blob' });
  }

  validateFile(type: 'projects' | 'tasks', file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/validate/${type}`, formData);
  }

  confirmImport(type: 'projects' | 'tasks', sessionToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirm/${type}`, { sessionToken });
  }

  /**
   * Fast preview using SheetJS directly in browser before posting
   */
  async quickPreviewFile(file: File): Promise<{ sheetName: string; rowsCount: number; colsCount: number; columns: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          const rowsCount = range.e.r; // exclude header row 0 in calculations
          const colsCount = range.e.c + 1;
          
          const columns: string[] = [];
          for (let c = 0; c < colsCount; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c });
            const cell = worksheet[cellRef];
            columns.push(cell ? cell.v : `Column ${c + 1}`);
          }
          
          resolve({
            sheetName: firstSheetName,
            rowsCount: Math.max(0, rowsCount),
            colsCount,
            columns
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Re-generate spreadsheet with an added "Errors Summary" worksheet at index 0,
   * and cell comments highlighting invalid inputs.
   */
  async downloadErrorReport(errors: ImportError[], originalFile: File, isProject: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 1. Generate error comments on the primary template sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          errors.forEach(err => {
            const colIndex = this.getColIndex(err.columnName, isProject);
            const cellRef = XLSX.utils.encode_cell({ r: err.rowNumber - 1, c: colIndex });
            
            if (!worksheet[cellRef]) {
              worksheet[cellRef] = { t: 'z', v: '' };
            }
            
            // Add comment to the cell
            const cell = worksheet[cellRef];
            if (!cell.c) {
              cell.c = [];
            }
            cell.c.push({
              a: 'System Validator',
              t: `${err.columnName}: ${err.errorMessage} (Value: "${err.value || ''}")`
            });
          });

          // 2. Add an "Errors Summary" sheet at the beginning
          const summaryData = errors.map(err => ({
            'Row Number': err.rowNumber,
            'Field / Column': err.columnName,
            'Uploaded Value': err.value || '(Empty)',
            'Error Detail': err.errorMessage
          }));
          
          const summarySheet = XLSX.utils.json_to_sheet(summaryData);
          
          // Format the Summary Sheet nicely
          const summaryCols = [{ wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 50 }];
          summarySheet['!cols'] = summaryCols;
          
          // Insert at index 0
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Errors Summary');
          const sheetNames = workbook.SheetNames;
          // Move the last sheet to first position
          sheetNames.splice(0, 0, sheetNames.pop()!);
          
          // 3. Trigger download of the modified file
          const outBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          const cleanName = originalFile.name.replace(/\.[^/.]+$/, "");
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${cleanName}_errors_report.xlsx`;
          link.click();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(originalFile);
    });
  }

  private getColIndex(colName: string, isProject: boolean): number {
    const clean = colName.toLowerCase().trim();
    if (isProject) {
      if (clean.includes("name")) return 0;
      if (clean.includes("description")) return 1;
      if (clean.includes("priority")) return 2;
      if (clean.includes("status")) return 3;
      if (clean.includes("start")) return 4;
      if (clean.includes("due")) return 5;
    } else {
      if (clean.includes("project")) return 0;
      if (clean.includes("title") || clean.includes("task")) return 1;
      if (clean.includes("description")) return 2;
      if (clean.includes("priority")) return 3;
      if (clean.includes("status")) return 4;
      if (clean.includes("member") || clean.includes("assignee") || clean.includes("email")) return 5;
      if (clean.includes("sprint")) return 6;
      if (clean.includes("due")) return 7;
    }
    return 0;
  }
}
