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
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          { path: 'profile', loadComponent: () => import('./features/settings/profile/profile-settings.component').then(m => m.ProfileSettingsComponent) },
          { path: 'security', loadComponent: () => import('./features/settings/security/security-settings.component').then(m => m.SecuritySettingsComponent) },
          { path: 'notifications', loadComponent: () => import('./features/settings/notifications/notifications-settings.component').then(m => m.NotificationsSettingsComponent) },
          { path: 'appearance', loadComponent: () => import('./features/settings/appearance/appearance-settings.component').then(m => m.AppearanceSettingsComponent) },
          { path: 'general', loadComponent: () => import('./features/settings/general/general-settings.component').then(m => m.GeneralSettingsComponent) },
          { path: 'team', loadComponent: () => import('./features/settings/team/team-settings.component').then(m => m.TeamSettingsComponent) },
          { path: 'roles', loadComponent: () => import('./features/settings/roles/roles-settings.component').then(m => m.RolesSettingsComponent) },
          { path: 'categories', loadComponent: () => import('./features/settings/categories/categories-settings.component').then(m => m.CategoriesSettingsComponent) },
          { path: 'sheetload', loadComponent: () => import('./features/settings/sheetload/sheetload-access.component').then(m => m.SheetloadAccessComponent) },
          { path: 'danger', loadComponent: () => import('./features/settings/danger/danger-zone.component').then(m => m.DangerZoneComponent) }
        ]
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
