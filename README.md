# 🧭 ProjectHub — Full-Stack Project & Team Management Platform

> A premium, immersive project management platform built for engineering leads and project managers who run multiple concurrent projects and cross-functional teams. One workspace. Total visibility.

---

## 📸 Overview

ProjectHub is a production-grade, end-to-end web application that replaces scattered spreadsheets, status meetings, and fragmented tools with a single, intelligent workspace. Built for teams of any size — designed around the reality of managing 10+ projects simultaneously.

The platform combines a **Spring Boot** backend with an **Angular** frontend styled around a dark-luxury design system — think Linear meets Notion, built for engineering teams.

---

## ✨ Key Features

### 🗂 Project Management
- Full project lifecycle tracking — Planning → In Progress → On Hold → Completed → Cancelled
- Priority levels: Low, Medium, High, Critical
- Auto-calculated project progress based on task completion
- At-risk detection: flags projects with < 50% progress within 7 days of deadline
- Kanban board with drag-and-drop reordering and column-drop animations
- Interactive Gantt timeline with drag-to-reschedule and critical path highlighting

### ✅ Task Management
- Global task view across all projects with multi-filter (project, assignee, status, priority, date)
- Kanban board per project: TODO → In Progress → In Review → Done
- Story point estimation with Fibonacci validation (1, 2, 3, 5, 8, 13)
- Task dependency linking
- Overdue detection with automatic highlighting
- Inline status updates — no page reload required

### 👥 Team Management
- Per-member productivity dashboard: tasks completed, story points, velocity trend
- Circular progress rings with animated reveals
- GitHub-style contribution heatmap — 30-day activity intensity per member
- Smart auto-assignment: suggests best-fit member based on workload + past experience
- Live collaborative cursors — see teammates' presence on shared boards in real time

### 🏃 Sprint Management
- Sprint planning with capacity calculator — warns on over-commitment based on historical velocity
- Burndown chart (live, per sprint)
- Velocity history chart — last 8 sprints
- Cross-project sprint overview

### 📊 Dashboard & Analytics
- KPI strip: active projects, open tasks, overdue items, team size
- Project health table with progress bars, due dates, and risk flags
- Team workload distribution bar chart
- Project status donut chart
- Scrollable activity feed — auto-refreshes every 30 seconds
- AI Daily Standup Generator — auto-summarises yesterday's updates per team member

### 📥 SheetLoad — Bulk Import via Excel
- Download pre-formatted `.xlsx` templates directly from the app
- Templates auto-inject live data: current team members, active projects, sprint names — all as Excel dropdowns
- Client-side row preview via SheetJS before hitting the server
- Server-side validation with per-row error reporting (row number + column + reason)
- Downloadable error report — annotated `.xlsx` with problem cells highlighted
- Session-token-based confirm flow — validate once, import on demand
- Restricted to **Manager** and **Team Lead** roles only

### 🔐 Role-Based Access Control
| Role | Access Level |
|------|-------------|
| `MANAGER` | Full access — all features including SheetLoad |
| `TEAM_LEAD` | Full access — all features including SheetLoad |
| `MEMBER` | Task updates, own profile, project boards |
| `VIEWER` | Read-only across all projects |

### ⌨️ Power User Features
- `⌘K` / `Ctrl+K` Command Palette — search tasks, switch projects, create work items from anywhere
- Focus Mode — distraction-free task view with built-in Pomodoro timer
- Full audit trail — every change logged with who, what, and when; time-travel history per task
- Contextual smart notifications — grouped by urgency, snoozable, non-spammy

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Java 21 |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Migrations | Flyway |
| Excel Processing | Apache POI 5.2.5 |
| API Docs | OpenAPI 3 / Swagger UI |
| Utilities | Lombok, MapStruct |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Angular 17+ (Standalone Components) |
| UI Library | Angular Material (dark-theme overridden) |
| Drag & Drop | Angular CDK DragDrop |
| Charts | Chart.js |
| Excel Client | SheetJS (xlsx) |
| State | NgRx / Angular Signals |
| Fonts | Instrument Serif · DM Sans · JetBrains Mono |
| Animations | CSS keyframes + Angular Animations |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker Compose | PostgreSQL + backend + frontend containers |
| Maven | Backend build |
| Angular CLI | Frontend build |

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Maven 3.9+

### 1. Clone the repository
```bash
git clone https://github.com/your-username/projecthub.git
cd projecthub
```

### 2. Start with Docker Compose (recommended)
```bash
docker-compose up --build
```
This spins up PostgreSQL, the Spring Boot API on port `8080`, and the Angular app on port `4200`.

### 3. Manual setup

**Backend**
```bash
cd backend
cp src/main/resources/application.example.yml src/main/resources/application.yml
# Edit application.yml: set DB credentials and JWT secret
mvn spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
ng serve
```

### 4. Access the app
| Service | URL |
|---------|-----|
| Angular App | http://localhost:4200 |
| Spring Boot API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

---

## 🌱 Seed Data

On first run, the database is automatically seeded with:
- 1 Manager account + 6 team members
- 14 projects across all statuses
- 70+ tasks distributed across projects and members
- 5 sprints (active and planned)
- 30 days of activity log history

**Default login**
```
Email:    manager@projecthub.dev
Password: admin123
```

---

## 📁 Project Structure

```
projecthub/
├── backend/                        # Spring Boot (Maven)
│   └── src/main/java/
│       ├── auth/                   # JWT security, filters, guards
│       ├── user/                   # User entity, profiles, stats
│       ├── project/                # Projects, members, activity
│       ├── task/                   # Tasks, comments, dependencies
│       ├── sprint/                 # Sprint management, burndown
│       ├── dashboard/              # Aggregated analytics endpoints
│       ├── import/                 # SheetLoad: templates, validation, execution
│       └── common/                 # Global exception handler, DTOs, enums
│
├── frontend/                       # Angular 17 (CLI)
│   └── src/app/
│       ├── core/                   # Auth service, JWT interceptor, guards
│       ├── shared/                 # Avatar, badge, progress-bar, empty-state
│       ├── layout/                 # Sidebar, topbar, breadcrumbs
│       └── features/
│           ├── dashboard/
│           ├── projects/           # List, Kanban, Gantt, detail
│           ├── tasks/              # Global task view, board, backlog
│           ├── team/               # Member cards, heatmap, profiles
│           ├── sprints/            # Sprint board, burndown, velocity
│           ├── sheetload/          # 4-step bulk import wizard
│           └── settings/           # Profile, team, tags
│
└── docker-compose.yml
```

---

## 🔌 API Reference

Full interactive documentation available at `/swagger-ui.html` when the backend is running.

**Core endpoint groups:**

| Group | Base Path |
|-------|-----------|
| Authentication | `/api/auth` |
| Users & Team | `/api/users` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Sprints | `/api/sprints` |
| Dashboard | `/api/dashboard` |
| SheetLoad Import | `/api/import` |

All responses follow a standard envelope:
```json
{
  "success": true,
  "data": { },
  "message": "OK",
  "timestamp": "2025-05-30T10:00:00Z"
}
```

---

## 🎨 Design System

ProjectHub uses a custom dark-luxury design system built on SCSS design tokens:

- **Palette** — Deep obsidian surfaces (`#080A0F` → `#1A2030`), single ice-blue accent (`#63B3ED`), semantic status colors
- **Typography** — Instrument Serif (display), DM Sans (body), JetBrains Mono (metrics & dates)
- **Motion** — Spring physics on drag, staggered list reveals, shimmer progress bars, SVG checkmark animations
- **Components** — Three-tier card elevation, ghost/primary/danger buttons, pill badges, razor-thin borders with glow on hover

---

## 🗺 Roadmap

- [ ] WebSocket real-time task updates (currently polling)
- [ ] Native mobile app (Angular + Capacitor)
- [ ] AI task breakdown — paste a feature description, get subtasks generated
- [ ] Slack / Teams notification integration
- [ ] Time tracking per task with weekly reports
- [ ] Public project status page (shareable with stakeholders)
- [ ] CSV export for all reports

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style. Backend uses Google Java Format; frontend uses the project's ESLint + Prettier config.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with Java · Spring Boot · Angular · PostgreSQL</p>
