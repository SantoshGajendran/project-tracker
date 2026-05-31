import { Component, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { Project, Task } from '../../core/models/models';

interface CmdItem {
  icon: string;
  label: string;
  type: 'Navigation' | 'Project' | 'Task' | 'Action';
  action: () => void;
}

@Component({
  selector: 'app-cmd-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div class="cmd-overlay" (click)="close()">
        <div class="cmd-panel" (click)="$event.stopPropagation()">
          <div class="cmd-search-bar">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              #cmdInput
              type="text" 
              class="cmd-input" 
              placeholder="Search files, routes, projects, tasks..." 
              [(ngModel)]="searchQuery"
              (keydown)="onKeyDown($event)"
              focus
            />
            <span class="cmd-esc-tip">ESC</span>
          </div>

          <div class="cmd-results">
            @if (filteredItems.length > 0) {
              @for (item of filteredItems; track $index) {
                <div 
                  class="cmd-item" 
                  [class.active]="$index === activeIndex"
                  (mouseenter)="activeIndex = $index"
                  (click)="executeItem(item)"
                >
                  <mat-icon class="cmd-icon">{{ item.icon }}</mat-icon>
                  <span class="cmd-label">{{ item.label }}</span>
                  <span class="cmd-type">{{ item.type }}</span>
                </div>
              }
            } @else {
              <div class="cmd-empty">No results found for "{{ searchQuery }}"</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cmd-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(8, 10, 15, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      animation: fadeIn 120ms ease both;
    }
    .cmd-panel {
      width: 560px;
      max-height: 420px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-xl);
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideDown 200ms var(--ease-out-expo) both;
    }
    .cmd-search-bar {
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-subtle);
      gap: 12px;
    }
    .search-icon {
      color: var(--text-muted);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .cmd-input {
      flex: 1;
      height: 54px;
      font-size: 15px;
      font-family: var(--font-body);
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
    }
    .cmd-input::placeholder {
      color: var(--text-muted);
    }
    .cmd-esc-tip {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--text-muted);
      border: 1px solid var(--border-default);
      border-radius: 4px;
      padding: 2px 6px;
    }
    .cmd-results {
      overflow-y: auto;
      max-height: 340px;
      padding: 8px 0;
    }
    .cmd-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 13.5px;
      color: var(--text-secondary);
      transition: background var(--duration-fast), color var(--duration-fast);
    }
    .cmd-item.active {
      background: var(--bg-overlay);
      color: var(--text-primary);
    }
    .cmd-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .cmd-item.active .cmd-icon {
      color: var(--accent);
    }
    .cmd-label {
      flex: 1;
      font-family: var(--font-body);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cmd-type {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      background: var(--bg-surface);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .cmd-empty {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13.5px;
      font-family: var(--font-body);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(-16px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class CmdPaletteComponent implements OnInit, OnDestroy {
  router = inject(Router);
  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  isOpen = signal(false);
  searchQuery = '';
  activeIndex = 0;

  private items: CmdItem[] = [];

  ngOnInit(): void {
    this.buildStaticItems();
    this.loadSearchData();
  }

  ngOnDestroy(): void {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Check Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }
    // Check Escape to close
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.searchQuery = '';
    this.activeIndex = 0;
    this.isOpen.set(true);
    // Focus input after render
    setTimeout(() => {
      const el = document.querySelector('.cmd-input') as HTMLInputElement;
      if (el) el.focus();
    }, 50);
  }

  close(): void {
    this.isOpen.set(false);
  }

  buildStaticItems(): void {
    this.items = [
      { icon: 'dashboard', label: 'Go to Dashboard', type: 'Navigation', action: () => this.router.navigate(['/']) },
      { icon: 'folder', label: 'Go to Projects', type: 'Navigation', action: () => this.router.navigate(['/projects']) },
      { icon: 'playlist_add_check', label: 'Go to Tasks', type: 'Navigation', action: () => this.router.navigate(['/tasks']) },
      { icon: 'groups', label: 'Go to Team', type: 'Navigation', action: () => this.router.navigate(['/team']) },
      { icon: 'timeline', label: 'Go to Sprints', type: 'Navigation', action: () => this.router.navigate(['/sprints']) },
      { icon: 'settings', label: 'Go to Settings', type: 'Navigation', action: () => this.router.navigate(['/settings']) },
    ];
  }

  loadSearchData(): void {
    // Fetch projects
    this.projectService.getProjects(undefined, undefined, undefined, 0, 100).subscribe(res => {
      if (res.success && res.data.content) {
        const projs: Project[] = res.data.content;
        const projItems = projs.map(p => ({
          icon: 'topic',
          label: `Project: ${p.name}`,
          type: 'Project' as const,
          action: () => this.router.navigate(['/projects', p.id])
        }));
        this.items = [...this.items, ...projItems];
      }
    });

    // Fetch tasks
    this.taskService.getTasks(undefined, undefined, undefined, undefined, undefined, undefined, 0, 200).subscribe(res => {
      if (res.success && res.data.content) {
        const tasks: Task[] = res.data.content;
        const taskItems = tasks.map(t => ({
          icon: 'assignment',
          label: `Task: ${t.title}`,
          type: 'Task' as const,
          action: () => this.router.navigate(['/tasks'], { queryParams: { search: t.title } })
        }));
        this.items = [...this.items, ...taskItems];
      }
    });
  }

  get filteredItems(): CmdItem[] {
    if (!this.searchQuery) return this.items.slice(0, 10); // Limit initial view
    const query = this.searchQuery.toLowerCase();
    return this.items.filter(item => 
      item.label.toLowerCase().includes(query) || 
      item.type.toLowerCase().includes(query)
    ).slice(0, 12);
  }

  onKeyDown(event: KeyboardEvent): void {
    const list = this.filteredItems;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % list.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + list.length) % list.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (list[this.activeIndex]) {
        this.executeItem(list[this.activeIndex]);
      }
    }
  }

  executeItem(item: CmdItem): void {
    item.action();
    this.close();
  }
}
