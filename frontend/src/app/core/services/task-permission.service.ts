import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Task, ProjectMember } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class TaskPermissionService {
  private auth = inject(AuthService);

  /**
   * Can the current user edit this task?
   * Mirrors the backend logic exactly — used to show/hide UI controls.
   */
  canEdit(task: Task, currentProjectMembers: ProjectMember[] = []): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;

    // MANAGER — always
    if (user.role === 'MANAGER') return true;

    // VIEWER — never
    if (user.role === 'VIEWER') return false;

    // Must be a member of this project
    const isMember = currentProjectMembers.some(m => m.userId === user.id);
    if (!isMember) return false;

    // TEAM_LEAD — any task in their project
    if (user.role === 'TEAM_LEAD') return true;

    // MEMBER — only their assigned tasks
    if (user.role === 'MEMBER') {
      return task.assignedToId === user.id;
    }

    return false;
  }

  canDelete(task: Task, currentProjectMembers: ProjectMember[] = []): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'MANAGER') return true;
    if (user.role === 'VIEWER' || user.role === 'MEMBER') return false;

    // TEAM_LEAD — must be in the project
    return currentProjectMembers.some(m => m.userId === user.id);
  }

  canReassign(): boolean {
    const user = this.auth.currentUser();
    return user?.role === 'MANAGER' || user?.role === 'TEAM_LEAD';
  }

  canCreate(currentProjectMembers: ProjectMember[] = []): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'MANAGER') return true;
    if (user.role === 'VIEWER') return false;
    return currentProjectMembers.some(m => m.userId === user.id);
  }
}
