import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/models';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    AvatarComponent,
    BadgeComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);

  profileForm!: FormGroup;
  users: User[] = [];
  
  // Tag / Categories management mock
  tags: string[] = ['Frontend', 'Backend', 'UI/UX', 'Database', 'Security', 'DevOps'];
  newTag: string = '';

  loading = true;
  submitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.maxLength(50)]],
      email: [{ value: user?.email || '', disabled: true }],
      avatar: [user?.avatar || '']
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data || [];
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) return;
    this.submitting = true;

    const user = this.authService.currentUser();
    if (!user) return;

    this.userService.updateUserProfile(user.id, this.profileForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          // Update auth state current user
          this.authService.currentUser.set({
            ...user,
            name: res.data.name,
            avatar: res.data.avatar
          });
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        }
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
      }
    });
  }

  // Invite Member simulation
  inviteMember(email: string, name: string, role: string): void {
    if (!email || !name) {
      this.snackBar.open('Please provide both name and email', 'Close', { duration: 3000 });
      return;
    }
    
    this.authService.register({
      name,
      email,
      password: 'password',
      role: role as UserRole,
      avatar: ''
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Team member invited successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to invite team member', 'Close', { duration: 3000 });
      }
    });
  }

  // Deactivate Member simulation
  deactivateMember(member: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Deactivate Member',
        message: `Are you sure you want to deactivate ${member.name}? They will lose access to all projects.`,
        confirmText: 'Deactivate',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // simulate deactivation: remove from user list
        this.users = this.users.filter(u => u.id !== member.id);
        this.snackBar.open(`User ${member.name} has been deactivated.`, 'Close', { duration: 3000 });
      }
    });
  }

  // Category tags
  addTag(): void {
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
      this.snackBar.open('Configuration tag added', 'Close', { duration: 2000 });
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.snackBar.open('Configuration tag removed', 'Close', { duration: 2000 });
  }
}
