export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export type UserRole = 'MANAGER' | 'TEAM_LEAD' | 'TEAMMATE';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SprintStatus = 'ACTIVE' | 'COMPLETED' | 'PLANNED';
export type ProjectMemberRole = 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
  progress: number;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isAtRisk: boolean;
}

export interface ProjectDetail {
  project: Project;
  members: ProjectMember[];
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  completedTasks: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  assignedToId?: number;
  assignedToName?: string;
  assignedToAvatar?: string;
  projectId: number;
  projectName: string;
  sprintId?: number;
  sprintName?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Sprint {
  id: number;
  name: string;
  projectId: number;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  goal?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface Comment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedById?: number;
  performedByName?: string;
  performedByAvatar?: string;
  description: string;
  timestamp: string;
}

export interface DashboardSummary {
  projectsByStatus: Record<ProjectStatus, number>;
  tasksByStatus: Record<TaskStatus, number>;
  teamWorkload: Record<string, number>;
  overdueCount: number;
}

export interface TeamProductivity {
  userId: number;
  name: string;
  avatar?: string;
  role: UserRole;
  tasksCompleted: number;
  storyPointsDone: number;
  productivityScore: number;
}

export interface ProjectHealth {
  projectId: number;
  name: string;
  progress: number;
  daysRemaining: number;
  status: ProjectStatus;
  priority: ProjectPriority;
  riskFlag: boolean;
}

export interface BurndownDataPoint {
  date: string;
  idealRemaining: number;
  actualRemaining?: number;
}

export interface BurndownData {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dataPoints: BurndownDataPoint[];
}
