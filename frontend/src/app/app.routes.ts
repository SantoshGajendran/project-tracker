import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'team',
        loadComponent: () => import('./features/team/team.component').then(m => m.TeamComponent)
      },
      {
        path: 'sprints',
        loadComponent: () => import('./features/sprints/sprints.component').then(m => m.SprintsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'import',
        loadComponent: () => import('./features/sheetload/sheetload.component').then(m => m.SheetLoadComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
