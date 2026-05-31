import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CategoryTag {
  id: string;
  name: string;
  color: string;
  projectCount: number;
}

@Component({
  selector: 'app-categories-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Project Categories & Tags</h2>
        <p>Manage project tags, priority categorizations and board taxonomy indicators</p>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Active Project Categories</h3>
          <p>Categories can be applied to projects to help filter list views and generate analytics.</p>
        </div>

        <div class="tags-section">
          <!-- Active categories list -->
          <div class="tags-list">
            <div class="tag-item" *ngFor="let tag of categories">
              <div class="tag-color-dot" [style.background]="tag.color"></div>
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count mono muted">{{ tag.projectCount }} project{{ tag.projectCount !== 1 ? 's' : '' }}</span>
              <div class="tag-actions">
                <button class="icon-btn-tag" (click)="editTag(tag)" title="Edit Tag">
                  <i class="ti ti-pencil"></i>
                </button>
                <button class="icon-btn-tag danger" (click)="deleteTag(tag)" title="Delete Tag">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Inline add new tag form -->
          <div class="tag-add-card">
            <h4>Create New Category</h4>
            <div class="tag-add-form">
              <div class="form-group-custom" style="flex: 1;">
                <label class="form-label-custom">Category Color</label>
                <div class="color-picker-row">
                  <div 
                    class="color-swatch-tag" 
                    *ngFor="let c of tagColors"
                    [style.background]="c"
                    [class.active]="selectedColor === c"
                    (click)="selectedColor = c"
                  ></div>
                </div>
              </div>

              <div class="form-group-custom" style="flex: 1.5; min-width: 200px;">
                <label class="form-label-custom">Category Name</label>
                <input class="input-field" placeholder="e.g. DevOps, Infrastructure..." [(ngModel)]="newTagName" (keyup.enter)="addCategory()">
              </div>

              <button class="btn-ghost" (click)="addCategory()" style="margin-top: 18px;">
                <i class="ti ti-plus"></i> Add Category
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-content {
      flex: 1;
      padding: 40px 56px;
      max-width: 760px;
    }

    .settings-section-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .settings-section-header h2 {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      font-style: italic;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .settings-section-header p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .card-header {
      margin-bottom: 24px;
    }

    .card-header h3 {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    .card-header p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }

    .tags-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .tag-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      transition: background var(--duration-fast);
    }

    .tag-item:last-child {
      border-bottom: none;
    }

    .tag-item:hover {
      background: var(--bg-elevated);
    }

    .tag-color-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .tag-name {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-primary);
      flex: 1;
    }

    .tag-count {
      font-size: 11px;
      color: var(--text-muted);
      margin-right: 20px;
    }

    .tag-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn-tag {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      transition: background var(--duration-fast), color var(--duration-fast);
    }

    .icon-btn-tag:hover {
      background: var(--bg-void);
      color: var(--text-primary);
    }

    .icon-btn-tag.danger:hover {
      color: var(--status-danger);
      background: rgba(252, 129, 129, 0.1);
    }

    /* Tag Add Card */
    .tag-add-card {
      background: var(--bg-void);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
    }

    .tag-add-card h4 {
      font-size: 13px;
      font-weight: 500;
      margin: 0 0 16px;
    }

    .tag-add-form {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .form-group-custom {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label-custom {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .color-picker-row {
      display: flex;
      gap: 8px;
      padding: 6px 0;
    }

    .color-swatch-tag {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: transform var(--duration-fast);
    }

    .color-swatch-tag:hover {
      transform: scale(1.15);
    }

    .color-swatch-tag.active {
      border-color: #ffffff;
      box-shadow: 0 0 0 2px currentColor;
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .tag-add-form {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class CategoriesSettingsComponent {
  snackBar = inject(MatSnackBar);

  categories: CategoryTag[] = [
    { id: '1', name: 'Frontend development', color: '#63B3ED', projectCount: 3 },
    { id: '2', name: 'Backend architecture', color: '#B794F4', projectCount: 4 },
    { id: '3', name: 'UI/UX visual layout', color: '#F687B3', projectCount: 2 },
    { id: '4', name: 'Database migrations', color: '#68D391', projectCount: 1 },
    { id: '5', name: 'Security standards', color: '#FC8181', projectCount: 2 },
    { id: '6', name: 'DevOps / deployment', color: '#F6AD55', projectCount: 1 }
  ];

  tagColors = [
    '#F687B3', // Rose
    '#68D391', // Emerald
    '#B794F4', // Violet
    '#63B3ED', // Ice Blue
    '#F6AD55', // Amber
    '#76E4F7', // Cyan
    '#FC8181', // Coral
    '#A0AEC0'  // Slate
  ];

  selectedColor = '#63B3ED';
  newTagName = '';

  addCategory(): void {
    const trimmed = this.newTagName.trim();
    if (!trimmed) {
      this.snackBar.open('Please input a category name', 'Close', { duration: 2000 });
      return;
    }

    if (this.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      this.snackBar.open('Category already exists', 'Close', { duration: 2000 });
      return;
    }

    this.categories.push({
      id: Date.now().toString(),
      name: trimmed,
      color: this.selectedColor,
      projectCount: 0
    });

    this.newTagName = '';
    this.snackBar.open(`Category ${trimmed} added`, 'Close', { duration: 3000 });
  }

  editTag(tag: CategoryTag): void {
    const updatedName = prompt('Enter new name for category:', tag.name);
    if (updatedName && updatedName.trim()) {
      tag.name = updatedName.trim();
      this.snackBar.open('Category name updated', 'Close', { duration: 2000 });
    }
  }

  deleteTag(tag: CategoryTag): void {
    this.categories = this.categories.filter(c => c.id !== tag.id);
    this.snackBar.open(`Category ${tag.name} deleted`, 'Close', { duration: 3000 });
  }
}
