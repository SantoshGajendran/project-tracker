import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-topbar></app-topbar>
        <main class="page-viewport animate-fade-in">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      margin-left: 64px; /* Default narrow sidebar width */
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      transition: margin-left var(--duration-slow) var(--ease-out-expo);
    }
    app-sidebar:hover + .main-content {
      margin-left: 220px; /* Expanded sidebar width */
    }
    .page-viewport {
      flex: 1;
      padding: 32px;
      position: relative;
    }
  `]
})
export class ShellComponent {}
