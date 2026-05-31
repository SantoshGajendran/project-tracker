import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ColorSwatch {
  name: string;
  code: string;
  class: string;
}

@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Appearance Settings</h2>
        <p>Customize the workspace themes, accent colorways, layouts, and font hierarchies</p>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Interface Theme</h3>
          <p>Choose the interface theme that best suits your environment.</p>
        </div>

        <div class="theme-grid">
          <div class="theme-option" [class.active]="selectedTheme === 'dark'" (click)="setTheme('dark')">
            <div class="theme-preview dark-preview">
              <span class="preview-sidebar"></span>
              <span class="preview-content"></span>
            </div>
            <span class="theme-label">Dark Mode (Default)</span>
          </div>

          <div class="theme-option" [class.active]="selectedTheme === 'system'" (click)="setTheme('system')">
            <div class="theme-preview system-preview">
              <span class="preview-sidebar"></span>
              <span class="preview-content"></span>
            </div>
            <span class="theme-label">System Default</span>
          </div>

          <div class="theme-option disabled-option" [class.active]="selectedTheme === 'light'" (click)="setTheme('light')">
            <div class="theme-preview light-preview">
              <span class="preview-sidebar"></span>
              <span class="preview-content"></span>
            </div>
            <span class="theme-label">Light Mode (Coming Soon)</span>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Workspace Accent Color</h3>
          <p>Select your workspace accent theme. Swatches overwrite default Ice Blue tokens.</p>
        </div>

        <div class="swatch-grid">
          <div 
            *ngFor="let s of swatches" 
            class="color-swatch-container" 
            [class.active]="selectedAccent === s.code"
            (click)="selectAccent(s.code)"
          >
            <div class="color-swatch" [style.background]="s.code" [style.color]="s.code"></div>
            <span class="swatch-name mono">{{ s.name }}</span>
          </div>
        </div>
      </div>

      <div class="form-grid-2">
        <!-- Spacing Density -->
        <div class="settings-card">
          <div class="card-header">
            <h3>Layout Density</h3>
            <p>Adjust padding and vertical compacting.</p>
          </div>
          <div class="density-group">
            <label class="density-option">
              <input type="radio" name="density" value="compact" [(ngModel)]="density" (change)="applyDensity()" />
              <div class="option-details">
                <span class="option-title">Compact</span>
                <span class="option-desc">Max density, tight views</span>
              </div>
            </label>
            <label class="density-option">
              <input type="radio" name="density" value="comfortable" [(ngModel)]="density" (change)="applyDensity()" />
              <div class="option-details">
                <span class="option-title">Comfortable</span>
                <span class="option-desc">Ideal spacing, standard</span>
              </div>
            </label>
            <label class="density-option">
              <input type="radio" name="density" value="spacious" [(ngModel)]="density" (change)="applyDensity()" />
              <div class="option-details">
                <span class="option-title">Spacious</span>
                <span class="option-desc">Large padding, relaxed</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Font Size Configuration -->
        <div class="settings-card">
          <div class="card-header">
            <h3>Base Font Size</h3>
            <p>Scale font sizes globally: current ({{ fontSize }}px)</p>
          </div>
          <div class="slider-container">
            <span class="slider-limit font-mono">12px</span>
            <input 
              type="range" 
              min="12" 
              max="18" 
              step="1" 
              [(ngModel)]="fontSize" 
              (input)="applyFontSize()" 
              class="range-slider"
            />
            <span class="slider-limit font-mono">18px</span>
          </div>
          <div class="slider-value mono" style="text-align: center; margin-top: 12px; font-size: 13px; color: var(--accent);">
            ● Display Scale: {{ fontSize }}px
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h3>Sidebar Layout</h3>
          <p>Choose your default desktop sidebar workspace mode.</p>
        </div>
        <div class="density-group horizontal-group">
          <label class="density-option">
            <input type="radio" name="sidebarMode" value="expanded" [(ngModel)]="sidebarMode" />
            <div class="option-details">
              <span class="option-title">Always expanded</span>
            </div>
          </label>
          <label class="density-option">
            <input type="radio" name="sidebarMode" value="auto" [(ngModel)]="sidebarMode" />
            <div class="option-details">
              <span class="option-title">Auto-collapse on hover</span>
            </div>
          </label>
          <label class="density-option">
            <input type="radio" name="sidebarMode" value="collapsed" [(ngModel)]="sidebarMode" />
            <div class="option-details">
              <span class="option-title">Always collapsed</span>
            </div>
          </label>
        </div>
      </div>

      <div class="card-actions-custom">
        <button class="btn-ghost" (click)="resetToDefaults()">Reset Defaults</button>
        <button class="btn-primary" (click)="saveAppearance()">Save Appearance</button>
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
      margin-bottom: 24px;
    }

    .card-header {
      margin-bottom: 20px;
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

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .theme-option {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      transition: border-color var(--duration-base), background var(--duration-base);
    }

    .theme-option:hover:not(.disabled-option) {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
    }

    .theme-option.active {
      border-color: var(--accent);
      background: var(--accent-glow);
    }

    .theme-option.disabled-option {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .theme-preview {
      width: 100%;
      height: 72px;
      border-radius: var(--radius-md);
      display: flex;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .preview-sidebar {
      width: 25%;
      height: 100%;
    }

    .preview-content {
      flex: 1;
      height: 100%;
    }

    .dark-preview .preview-sidebar { background: #131720; }
    .dark-preview .preview-content { background: #080A0F; }

    .system-preview .preview-sidebar { background: #1a2030; }
    .system-preview .preview-content { background: #0d1017; }

    .light-preview .preview-sidebar { background: #E4E4E7; }
    .light-preview .preview-content { background: #FAF9F6; }

    .theme-label {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .swatch-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .color-swatch-container {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: border-color var(--duration-fast), background var(--duration-fast);
    }

    .color-swatch-container:hover {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
    }

    .color-swatch-container.active {
      border-color: var(--accent);
      background: var(--accent-glow);
    }

    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--bg-surface);
      flex-shrink: 0;
      transition: transform var(--duration-fast);
    }

    .color-swatch-container:hover .color-swatch {
      transform: scale(1.1);
    }

    .color-swatch-container.active .color-swatch {
      box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
    }

    .swatch-name {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: capitalize;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .density-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .density-group.horizontal-group {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .density-group.horizontal-group .density-option {
      flex: 1;
      min-width: 150px;
    }

    .density-option {
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      background: var(--bg-surface);
      transition: border-color var(--duration-fast), background var(--duration-fast);
    }

    .density-option:hover {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
    }

    .density-option input[type="radio"] {
      margin-top: 4px;
      accent-color: var(--accent);
    }

    .option-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .option-desc {
      font-size: 11px;
      color: var(--text-muted);
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
    }

    .slider-limit {
      font-size: 11px;
      color: var(--text-muted);
    }

    .range-slider {
      flex: 1;
      accent-color: var(--accent);
      cursor: pointer;
    }

    .card-actions-custom {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }

    @media (max-width: 767px) {
      .settings-content {
        padding: 24px 16px;
      }
      .theme-grid {
        grid-template-columns: 1fr;
      }
      .swatch-grid {
        grid-template-columns: 1fr 1fr;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
      .density-group.horizontal-group {
        flex-direction: column;
      }
    }
  `]
})
export class AppearanceSettingsComponent implements OnInit {
  snackBar = inject(MatSnackBar);

  selectedTheme = 'dark';
  selectedAccent = '#63B3ED';
  density = 'comfortable';
  fontSize = 15;
  sidebarMode = 'auto';

  swatches: ColorSwatch[] = [
    { name: 'Ice Blue', code: '#63B3ED', class: 'blue' },
    { name: 'Violet', code: '#B794F4', class: 'violet' },
    { name: 'Emerald', code: '#68D391', class: 'emerald' },
    { name: 'Rose', code: '#F687B3', class: 'rose' },
    { name: 'Amber', code: '#F6AD55', class: 'amber' },
    { name: 'Cyan', code: '#76E4F7', class: 'cyan' },
    { name: 'Coral', code: '#FC8181', class: 'coral' },
    { name: 'Slate', code: '#A0AEC0', class: 'slate' }
  ];

  ngOnInit(): void {
    // Read from localStorage
    const savedAccent = localStorage.getItem('workspace-accent') || '#63B3ED';
    this.selectedAccent = savedAccent;

    const savedTheme = localStorage.getItem('workspace-theme') || 'dark';
    this.selectedTheme = savedTheme;

    const savedDensity = localStorage.getItem('workspace-density') || 'comfortable';
    this.density = savedDensity;

    const savedFontSize = parseInt(localStorage.getItem('workspace-fontsize') || '15', 10);
    this.fontSize = savedFontSize;

    const savedSidebarMode = localStorage.getItem('workspace-sidebar') || 'auto';
    this.sidebarMode = savedSidebarMode;
  }

  setTheme(theme: string): void {
    if (theme === 'light') {
      this.snackBar.open('Light theme is coming soon!', 'Close', { duration: 3000 });
      return;
    }
    this.selectedTheme = theme;
    document.documentElement.setAttribute('theme', theme);
    localStorage.setItem('workspace-theme', theme);
    this.snackBar.open(`Theme set to ${theme}`, 'Close', { duration: 2000 });
  }

  selectAccent(code: string): void {
    this.selectedAccent = code;
    document.documentElement.style.setProperty('--accent', code);
    localStorage.setItem('workspace-accent', code);
    this.snackBar.open('Accent color updated', 'Close', { duration: 2000 });
  }

  applyDensity(): void {
    let paddingVal = '16px';
    if (this.density === 'compact') paddingVal = '8px';
    else if (this.density === 'spacious') paddingVal = '24px';

    document.documentElement.style.setProperty('--space-md', paddingVal);
    localStorage.setItem('workspace-density', this.density);
  }

  applyFontSize(): void {
    document.documentElement.style.setProperty('--base-font-size', `${this.fontSize}px`);
    document.documentElement.style.fontSize = `${this.fontSize}px`;
    localStorage.setItem('workspace-fontsize', this.fontSize.toString());
  }

  resetToDefaults(): void {
    this.selectedTheme = 'dark';
    this.selectedAccent = '#63B3ED';
    this.density = 'comfortable';
    this.fontSize = 15;
    this.sidebarMode = 'auto';

    document.documentElement.setAttribute('theme', 'dark');
    document.documentElement.style.setProperty('--accent', '#63B3ED');
    document.documentElement.style.setProperty('--space-md', '16px');
    document.documentElement.style.setProperty('--base-font-size', '15px');
    document.documentElement.style.fontSize = '15px';

    localStorage.removeItem('workspace-accent');
    localStorage.removeItem('workspace-theme');
    localStorage.removeItem('workspace-density');
    localStorage.removeItem('workspace-fontsize');
    localStorage.removeItem('workspace-sidebar');

    this.snackBar.open('Appearance reset to defaults', 'Close', { duration: 3000 });
  }

  saveAppearance(): void {
    this.snackBar.open('Appearance configuration saved', 'Close', { duration: 3000 });
  }
}
