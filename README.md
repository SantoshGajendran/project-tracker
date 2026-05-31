# Project & Team Management Application

A full-stack, production-grade Project & Team Management Application. The dashboard tracks projects, sprint timelines, burndown charts, and team members with visual aesthetics, light/dark mode configuration, and drag-and-drop Kanban workflow boards.

## Tech Stack
- **Backend**: Java 21 + Spring Boot 3.2.5 + Spring Security + Spring Data JPA + PostgreSQL + Flyway (database migrations) + Lombok + MapStruct
- **Frontend**: Angular 17 + Angular Material + Chart.js + Angular CDK (drag-and-drop)
- **Auth**: JWT-based stateless authentication

---

## Getting Started

### Prerequisites
- **Java SE Development Kit (JDK)**: Version 21
- **Apache Maven**: Version 3.9+
- **Node.js**: Version 24+
- **NPM**: Version 11+
- **PostgreSQL Server**: Listening on default port `5432`

---

## 1. Database Configuration
The application automatically manages its database. On startup, a helper class will verify if the `project_tracker` database exists on your PostgreSQL server, and create it if missing.

Ensure your local PostgreSQL server is active with the following credentials (pre-configured in `backend/src/main/resources/application.yml`):
- **Username**: `postgres`
- **Password**: `Saazvat@123`
- **Port**: `5432`

---

## 2. Running the Backend Server (Spring Boot)
Open a terminal in the `/backend` directory and compile/run the server using Maven:

```bash
cd backend
mvn clean spring-boot:run
```

- The API server starts on **`http://localhost:8080`**.
- OpenAPI/Swagger documentation UI is available at **`http://localhost:8080/swagger-ui.html`**.
- The database is seeded on the first startup with 1 PM user, 6 team members, 14 projects, 70 tasks, 5 sprints, and 30 days of activity logs.

To run the backend tests:
```bash
mvn clean test
```

---

## 3. Running the Frontend App (Angular)
Open another terminal in the `/frontend` directory, install packages and start the Angular CLI dev server:

```bash
cd frontend
npm install
npm run start
```

- The web app starts on **`http://localhost:4200`**.
- Open your browser to `http://localhost:4200` to access the application.

To build the production bundle:
```bash
npm run build
```

---

## Demo Credentials
You can log into the application using the following accounts:

### 1. Project Manager ( Sarah Jenkins )
- **Email**: `pm@projecttracker.com`
- **Password**: `password`
- *Access*: Can create/delete projects, assign/remove team members, manage sprints, and update all tasks.

### 2. Team Member ( John Doe )
- **Email**: `john@projecttracker.com`
- **Password**: `password`
- *Access*: Can view dashboard metrics, drag-and-drop tasks assigned to them to update status, and manage their settings.
