import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SheetLoadService, ImportError, ImportValidationReport } from '../../core/services/sheetload.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { StatusClassPipe } from '../../shared/pipes/status-class.pipe';

@Component({
  selector: 'app-sheetload',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    FileSizePipe,
    StatusClassPipe
  ],
  templateUrl: './sheetload.component.html',
  styleUrls: ['./sheetload.component.css']
})
export class SheetLoadComponent {
  private sheetLoadService = inject(SheetLoadService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Stepper State: 1 = Choose, 2 = Preview/Upload, 3 = Validate Report, 4 = Complete
  currentStep = 1;
  selectedType: 'projects' | 'tasks' | null = null;
  
  // File variables
  selectedFile: File | null = null;
  isDragOver = false;
  
  // SheetJS preview variables
  localPreview: {
    sheetName: string;
    rowsCount: number;
    colsCount: number;
    columns: string[];
  } | null = null;

  // Server Validation Response
  validationReport: ImportValidationReport | null = null;
  
  // Progress & loading indicators
  isValidating = false;
  isConfirming = false;
  importResultCount = 0;

  selectImportType(type: 'projects' | 'tasks'): void {
    this.selectedType = type;
  }

  downloadTemplate(): void {
    if (!this.selectedType) return;
    
    this.sheetLoadService.downloadTemplate(this.selectedType).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${this.selectedType}_template.xlsx`;
        link.click();
        this.snackBar.open(`${this.selectedType === 'projects' ? 'Projects' : 'Tasks'} template downloaded`, 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to download template. Please try again.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  nextToUpload(): void {
    if (this.selectedType) {
      this.currentStep = 2;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.selectedFile = null;
        this.localPreview = null;
        this.validationReport = null;
      } else if (this.currentStep === 2) {
        this.validationReport = null;
      }
    }
  }

  // Drag & Drop Handlers
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
    
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFileSelection(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.snackBar.open('Invalid file type. Please upload an Excel spreadsheet (.xlsx or .xls)', 'Dismiss', { duration: 3000 });
      return;
    }

    this.selectedFile = file;
    this.localPreview = null;
    
    // Perform browser-side SheetJS preview
    this.sheetLoadService.quickPreviewFile(file)
      .then(preview => {
        this.localPreview = preview;
      })
      .catch(() => {
        this.snackBar.open('Error parsing Excel preview. File might be corrupted.', 'Dismiss', { duration: 3000 });
      });
  }

  triggerValidation(): void {
    if (!this.selectedType || !this.selectedFile) return;
    
    this.isValidating = true;
    this.sheetLoadService.validateFile(this.selectedType, this.selectedFile).subscribe({
      next: (res) => {
        this.isValidating = false;
        if (res.success) {
          this.validationReport = res.data;
          this.currentStep = 3;
        } else {
          this.snackBar.open(res.message || 'Validation failed', 'Dismiss', { duration: 3000 });
        }
      },
      error: (err) => {
        this.isValidating = false;
        this.snackBar.open(err.error?.message || 'Server error during validation', 'Dismiss', { duration: 3000 });
      }
    });
  }

  downloadErrorReport(): void {
    if (!this.validationReport || !this.selectedFile || !this.selectedType) return;
    
    this.sheetLoadService.downloadErrorReport(
      this.validationReport.invalidRows,
      this.selectedFile,
      this.selectedType === 'projects'
    ).then(() => {
      this.snackBar.open('Error report downloaded with cell-level comments', 'Dismiss', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open('Failed to generate error report', 'Dismiss', { duration: 3000 });
    });
  }

  confirmImport(): void {
    if (!this.selectedType || !this.validationReport) return;
    
    this.isConfirming = true;
    this.sheetLoadService.confirmImport(this.selectedType, this.validationReport.sessionToken).subscribe({
      next: (res) => {
        this.isConfirming = false;
        if (res.success) {
          this.importResultCount = res.data?.count || 0;
          this.currentStep = 4;
        } else {
          this.snackBar.open(res.message || 'Import confirmation failed', 'Dismiss', { duration: 3000 });
        }
      },
      error: (err) => {
        this.isConfirming = false;
        this.snackBar.open(err.error?.message || 'Server error during confirmation', 'Dismiss', { duration: 3000 });
      }
    });
  }

  resetWizard(): void {
    this.currentStep = 1;
    this.selectedType = null;
    this.selectedFile = null;
    this.localPreview = null;
    this.validationReport = null;
    this.importResultCount = 0;
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
