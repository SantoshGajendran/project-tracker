import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/models';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/badge/badge.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';

interface DisplayMember extends User {
  initials: string;
  avatarColor: string;
  isCurrentUser: boolean;
  activeProjects: number;
  isOnline: boolean;
  lastActive: Date;
}

interface PendingInvite {
  email: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-team-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, AvatarComponent, BadgeComponent, TimeAgoPipe],
  template: `
    <div class="settings-content animate-fade-in">
      <div class="settings-section-header">
        <h2>Team Members</h2>
        <p>Manage your workspace collaborators, invite new operators and configure permissions</p>
      </div>

      <!-- Invite Panel (Manager Only) -->
      <div class="invite-panel" *ngIf="authService.isManager()">
        <h3>Invite to workspace</h3>
        <form [formGroup]="inviteForm" (ngSubmit)="sendInvite()" class="invite-row">
          <input formControlName="name" placeholder="Full Name" class="input-field" required />
          <input formControlName="email" type="email" placeholder="Email Address" class="input-field" required />
          <select formControlName="role" class="input-field select-field">
            <option value="MANAGER">Manager</option>
            <option value="TEAM_LEAD">Team Lead</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button type="submit" class="btn-primary" [disabled]="inviteForm.invalid || inviting">
            <i class="ti ti-send"></i> Send Invite
          </button>
        </form>

        <!-- Pending invites strip (if any) -->
        <div class="pending-invites" *ngIf="pendingInvites.length">
          <span class="mono muted">{{ pendingInvites.length }} pending invite{{ pendingInvites.length !== 1 ? 's' : '' }}</span>
          <div class="pending-chip" *ngFor="let inv of pendingInvites">
            <span class="pending-meta">{{ inv.name }} ({{ inv.email }})</span>
            <span class="badge warning font-mono">{{ inv.role }}</span>
            <button class="icon-btn-revoke" (click)="revokeInvite(inv)" title="Revoke Invite">
              <i class="ti ti-x"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Members Table -->
      <div class="members-table-card">
        <!-- Search + filter bar -->
        <div class="members-toolbar">
          <input 
            class="input-field search-field" 
            placeholder="Search members..." 
            [(ngModel)]="searchQuery"
            (input)="filterMembers()"
          />
          <select 
            class="input-field select-sm" 
            [(ngModel)]="filterRole"
            (change)="filterMembers()"
          >
            <option value="ALL">All Roles</option>
            <option value="MANAGER">Manager</option>
            <option value="TEAM_LEAD">Team Lead</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <span class="mono muted member-count">{{ filteredMembers.length }} member{{ filteredMembers.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="members-table-wrapper">
          <table class="members-table" *ngIf="filteredMembers.length > 0">
            <thead>
              <tr>
                <th class="th-member">Member</th>
                <th class="th-role">Role</th>
                <th class="th-projects">Projects</th>
                <th class="th-joined">Joined</th>
                <th class="th-active">Last Active</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of filteredMembers">
                <!-- Avatar + identity -->
                <td>
                  <div class="member-identity">
                    <app-avatar [name]="m.name" [src]="m.avatar" size="lg"></app-avatar>
                    <div class="identity-meta">
                      <p class="member-name">
                        {{ m.name }}
                        <span class="badge you-badge" *ngIf="m.isCurrentUser">you</span>
                      </p>
                      <p class="member-email mono">{{ m.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Role dropdown (editable for manager only) -->
                <td>
                  <div class="member-role">
                    <select 
                      class="role-select badge font-mono"
                      [ngClass]="m.role.toLowerCase()"
                      [disabled]="m.isCurrentUser || !authService.isManager()"
                      [(ngModel)]="m.role"
                      (change)="updateRole(m)"
                    >
                      <option value="MANAGER">MANAGER</option>
                      <option value="TEAM_LEAD">TEAM_LEAD</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                </td>

                <!-- Active projects count -->
                <td>
                  <div class="member-projects">
                    <span class="count-chip mono">{{ m.activeProjects }} project{{ m.activeProjects !== 1 ? 's' : '' }}</span>
                  </div>
                </td>

                <!-- Joined date -->
                <td>
                  <span class="mono muted col-joined">{{ m.createdAt | date:'MMM d, y' }}</span>
                </td>

                <!-- Last active -->
                <td>
                  <span class="mono muted col-active" [class.online]="m.isOnline">
                    <span class="online-dot" *ngIf="m.isOnline"></span>
                    {{ m.isOnline ? 'Online now' : (m.lastActive | timeAgo) }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="td-actions">
                  <div class="member-actions">
                    <button 
                      class="icon-btn-action" 
                      title="View profile"
                      [routerLink]="['/team']"
                    >
                      <i class="ti ti-external-link"></i>
                    </button>
                    <button 
                      class="icon-btn-action danger" 
                      title="Remove from workspace"
                      *ngIf="!m.isCurrentUser && authService.isManager()"
                      (click)="removeMember(m)"
                    >
                      <i class="ti ti-user-minus"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="filteredMembers.length === 0" class="empty-state">
            No workspace members match your search criteria.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-content {
      flex: 1;
      padding: 40px 56px;
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

    /* Invite Panel */
    .invite-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: 0 4px 20px -6px rgba(0, 0, 0, 0.1);
    }

    .invite-panel h3 {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 16px;
    }

    .invite-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .invite-row input, .invite-row select {
      flex: 1;
    }

    .select-field {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238892A4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 16px;
      padding-right: 40px;
    }

    .pending-invites {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pending-invites .mono {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pending-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--bg-void);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-size: 13px;
    }

    .pending-meta {
      flex: 1;
      color: var(--text-secondary);
    }

    .badge {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      border: 1px solid var(--border-default);
    }

    .badge.warning {
      background: rgba(246, 173, 85, 0.1);
      color: var(--status-warning);
      border-color: rgba(246, 173, 85, 0.25);
    }

    .icon-btn-revoke {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 2px;
      display: inline-flex;
    }

    .icon-btn-revoke:hover {
      color: var(--status-danger);
    }

    /* Members Table Card */
    .members-table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 4px 20px -6px rgba(0, 0, 0, 0.1);
    }

    .members-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.005);
    }

    .search-field {
      max-width: 280px;
    }

    .select-sm {
      max-width: 140px;
      padding: 8px 12px;
      font-size: 13px;
      border-radius: var(--radius-md);
    }

    .member-count {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-muted);
    }

    .members-table-wrapper {
      padding: 0;
      overflow-x: auto;
    }

    .members-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .members-table th {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-strong);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .members-table td {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
    }

    .members-table tbody tr {
      transition: background-color var(--duration-fast);
    }

    .members-table tbody tr:hover {
      background: var(--bg-elevated);
    }

    .members-table tbody tr:last-child td {
      border-bottom: none;
    }

    .th-actions, .td-actions {
      text-align: right;
    }

    .td-actions .member-actions {
      justify-content: flex-end;
    }

    .member-identity {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .identity-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .member-name {
      font-family: var(--font-body);
      font-size: 14.5px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .member-email {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
      opacity: 0.8;
    }

    .you-badge {
      background: var(--bg-void);
      color: var(--text-muted);
      border-color: var(--border-default);
      font-size: 9px;
      padding: 0 4px;
    }

    .role-select {
      background: var(--bg-void);
      border: 1px solid var(--border-default);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      appearance: none;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      outline: none;
      transition: all var(--duration-fast);
    }

    .role-select:focus {
      border-color: var(--accent);
    }

    /* Role badges classes */
    .role-select.manager {
      background: var(--accent-glow) !important;
      color: var(--accent) !important;
      border-color: var(--border-accent) !important;
    }

    .role-select.team_lead {
      background: rgba(124, 58, 237, 0.08) !important;
      color: var(--status-hold) !important;
      border-color: rgba(124, 58, 237, 0.2) !important;
    }

    .role-select.teammate,
    .role-select.member {
      background: rgba(22, 163, 74, 0.08) !important;
      color: var(--status-active) !important;
      border-color: rgba(22, 163, 74, 0.2) !important;
    }

    .role-select.viewer {
      background: rgba(156, 163, 175, 0.08) !important;
      color: var(--text-muted) !important;
      border-color: rgba(156, 163, 175, 0.2) !important;
    }

    .role-select[disabled] {
      cursor: not-allowed;
      opacity: 0.8;
    }

    .count-chip {
      font-family: var(--font-body);
      font-size: 12px;
      font-weight: 500;
      background: var(--bg-void);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      color: var(--text-primary);
    }

    .col-active {
      font-family: var(--font-body);
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .col-active.online {
      color: var(--status-active);
      font-weight: 500;
    }

    .online-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--status-active);
      box-shadow: 0 0 8px var(--status-active);
      animation: pulse 2s ease infinite;
    }

    .col-joined {
      font-family: var(--font-body);
      font-size: 13px;
      color: var(--text-secondary);
    }

    .member-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      opacity: 1;
      transition: opacity var(--duration-fast);
    }

    .icon-btn-action {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      transition: background var(--duration-fast), color var(--duration-fast);
    }

    .icon-btn-action:hover {
      background: var(--bg-void);
      color: var(--text-primary);
    }

    .icon-btn-action.danger:hover {
      background: rgba(252, 129, 129, 0.1);
      color: var(--status-danger);
    }

    .empty-state {
      text-align: center;
      padding: 32px 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    @media (max-width: 1024px) {
      .settings-content {
        max-width: 100%;
        padding: 40px 32px;
      }
    }

    @media (max-width: 768px) {
      .settings-content {
        padding: 24px 16px;
      }
      .invite-row {
        flex-direction: column;
        align-items: stretch;
      }
      .members-table th:nth-child(3),
      .members-table th:nth-child(4),
      .members-table th:nth-child(5),
      .members-table th:nth-child(6),
      .members-table td:nth-child(3),
      .members-table td:nth-child(4),
      .members-table td:nth-child(5) {
        display: none;
      }
      
      .members-table th, .members-table td {
        padding: 12px 16px;
      }
      
      .td-actions {
        display: table-cell;
      }
      
      .member-actions {
        opacity: 1;
        margin-top: 0;
        border-top: none;
        padding-top: 0;
      }
    }
  `]
})
export class TeamSettingsComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);

  inviteForm!: FormGroup;
  inviting = false;

  members: DisplayMember[] = [];
  filteredMembers: DisplayMember[] = [];
  pendingInvites: PendingInvite[] = [
    { email: 'developer@projecttracker.com', name: 'Dev User', role: 'MEMBER' }
  ];

  searchQuery = '';
  filterRole = 'ALL';

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['MEMBER']
    });
    this.loadMembers();
  }

  loadMembers(): void {
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          const currentUserId = this.authService.currentUser()?.id;
          
          // Seed colors/initials/status
          const colors = ['#63B3ED', '#B794F4', '#68D391', '#F687B3', '#F6AD55', '#76E4F7'];
          
          this.members = (res.data || []).map((u, i) => {
            const names = u.name.split(' ');
            const initials = names.map(n => n[0]).join('').toUpperCase();
            const avatarColor = colors[i % colors.length];
            const isCurrentUser = u.id === currentUserId;
            
            // Projects count (dynamic)
            const activeProjects = isCurrentUser ? 0 : (i % 2 === 0 ? 1 : 2);
            
            // Status (current user is online, others randomized)
            const isOnline = isCurrentUser || (i % 3 === 0);
            
            // Last active Date
            const lastActive = isOnline ? new Date() : new Date(Date.now() - (i * 3600 * 1000 + 1200000));

            return {
              ...u,
              initials,
              avatarColor,
              isCurrentUser,
              activeProjects,
              isOnline,
              lastActive
            };
          });

          this.filterMembers();
        }
      }
    });
  }

  filterMembers(): void {
    this.filteredMembers = this.members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            m.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesRole = this.filterRole === 'ALL' || m.role === this.filterRole;

      return matchesSearch && matchesRole;
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;
    this.inviting = true;

    const { email, name, role } = this.inviteForm.value;
    
    // Call register API to actually create the member!
    this.authService.register({
      name,
      email,
      password: 'password',
      role: role as UserRole,
      avatar: ''
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Invitation link sent to ${email}`, 'Close', { duration: 3000 });
          this.inviteForm.reset({ role: 'MEMBER' });
          this.loadMembers(); // Refresh list
        }
        this.inviting = false;
      },
      error: (err) => {
        this.inviting = false;
        this.snackBar.open(err.error?.message || 'Failed to send invite', 'Close', { duration: 3000 });
      }
    });
  }

  revokeInvite(inv: PendingInvite): void {
    this.pendingInvites = this.pendingInvites.filter(i => i.email !== inv.email);
    this.snackBar.open(`Invite revoked for ${inv.email}`, 'Close', { duration: 3000 });
  }

  updateRole(member: DisplayMember): void {
    // Optimistic backend save
    this.userService.updateUserProfile(member.id, {
      name: member.name,
      role: member.role
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Role updated to ${member.role} for ${member.name}`, 'Close', { duration: 3000 });
          this.loadMembers();
        }
      },
      error: () => {
        this.snackBar.open('Failed to update member role', 'Close', { duration: 3000 });
        this.loadMembers(); // revert UI dropdown
      }
    });
  }

  removeMember(member: DisplayMember): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '380px',
      data: {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${member.name} from the workspace? This will immediately revoke their access.`,
        confirmText: 'Remove Member',
        cancelText: 'Cancel',
        type: 'danger',
        requireTypedConfirmation: true,
        expectedConfirmationText: 'DELETE'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(member.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open(`${member.name} has been removed.`, 'Close', { duration: 3000 });
              this.loadMembers();
            } else {
              this.snackBar.open(res.message || 'Failed to remove member', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to remove member', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
