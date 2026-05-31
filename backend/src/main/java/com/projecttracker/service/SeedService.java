package com.projecttracker.service;

import com.projecttracker.entity.*;
import com.projecttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class SeedService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final CommentRepository commentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProjectService projectService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            System.out.println("Database already seeded. Skipping seeding.");
            return;
        }

        System.out.println("Seeding database with sample data...");

        // 1. Create Users
        List<User> users = new ArrayList<>();
        
        // PM User
        User pm = User.builder()
                .name("Sarah Jenkins")
                .email("pm@projecttracker.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.MANAGER)
                .avatar("")
                .createdAt(Instant.now().minus(35, ChronoUnit.DAYS))
                .build();
        users.add(userRepository.save(pm));

        // Team members (6 members)
        String[] firstNames = {"John", "Jane", "Bob", "Alice", "Charlie", "David"};
        String[] lastNames = {"Doe", "Smith", "Johnson", "Williams", "Brown", "Davis"};
        String[] avatars = { "", "", "", "", "", "" };

        for (int i = 0; i < 6; i++) {
            User member = User.builder()
                    .name(firstNames[i] + " " + lastNames[i])
                    .email(firstNames[i].toLowerCase() + "@projecttracker.com")
                    .password(passwordEncoder.encode("password"))
                    .role(UserRole.TEAMMATE)
                    .avatar(avatars[i])
                    .createdAt(Instant.now().minus(35 - i, ChronoUnit.DAYS))
                    .build();
            users.add(userRepository.save(member));
        }

        // 2. Create 14 Projects
        String[] projectNames = {
                "E-Commerce Re-platform", "Mobile App v2.0", "HR Portal Migrations",
                "Data Warehouse Upgrade", "Security Audit Remediation", "Cloud Cost Optimization",
                "Brand Identity Refresh", "AI Chatbot Integration", "GDPR Compliance Check",
                "Marketing Landing Pages", "IoT Sensors Dashboard", "API Gateway Setup",
                "Internal Hackathon 2026", "Partner Portal Release"
        };

        ProjectStatus[] projectStatuses = {
                ProjectStatus.IN_PROGRESS, ProjectStatus.IN_PROGRESS, ProjectStatus.PLANNING,
                ProjectStatus.ON_HOLD, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED,
                ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED,
                ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED,
                ProjectStatus.PLANNING, ProjectStatus.IN_PROGRESS
        };

        ProjectPriority[] projectPriorities = {
                ProjectPriority.HIGH, ProjectPriority.CRITICAL, ProjectPriority.MEDIUM,
                ProjectPriority.HIGH, ProjectPriority.CRITICAL, ProjectPriority.LOW,
                ProjectPriority.LOW, ProjectPriority.HIGH, ProjectPriority.CRITICAL,
                ProjectPriority.MEDIUM, ProjectPriority.LOW, ProjectPriority.HIGH,
                ProjectPriority.MEDIUM, ProjectPriority.HIGH
        };

        int[] startOffsets = {-30, -15, 0, -45, -10, -60, 10, -20, -90, -30, -60, -40, 5, -12};
        int[] dueOffsets = {60, 45, 90, 15, 5, -10, 40, 40, -30, -15, 0, -20, 8, 8};

        List<Project> projects = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < 14; i++) {
            Project project = Project.builder()
                    .name(projectNames[i])
                    .description("Sample description for " + projectNames[i] + ". This project is a crucial part of our corporate roadmap.")
                    .status(projectStatuses[i])
                    .priority(projectPriorities[i])
                    .startDate(today.plusDays(startOffsets[i]))
                    .dueDate(today.plusDays(dueOffsets[i]))
                    .createdBy(pm)
                    .progress(0.0)
                    .build();
            
            project.setCreatedAt(Instant.now().minus(35 + i, ChronoUnit.DAYS));
            Project savedProject = projectRepository.save(project);
            projects.add(savedProject);

            // Assign members to projects
            // Creator is Owner
            projectMemberRepository.save(ProjectMember.builder()
                    .project(savedProject)
                    .user(pm)
                    .role(ProjectMemberRole.OWNER)
                    .joinedAt(savedProject.getCreatedAt())
                    .build());

            // Assign 2-3 extra team members randomly
            Random rand = new Random(i);
            int membersToAssign = 2 + rand.nextInt(2);
            List<Integer> assignedIndices = new ArrayList<>();
            while (assignedIndices.size() < membersToAssign) {
                int idx = 1 + rand.nextInt(6); // member users are indices 1..6
                if (!assignedIndices.contains(idx)) {
                    assignedIndices.add(idx);
                    projectMemberRepository.save(ProjectMember.builder()
                            .project(savedProject)
                            .user(users.get(idx))
                            .role(rand.nextBoolean() ? ProjectMemberRole.CONTRIBUTOR : ProjectMemberRole.VIEWER)
                            .joinedAt(savedProject.getCreatedAt().plus(1, ChronoUnit.DAYS))
                            .build());
                }
            }
        }

        // 3. Create Sprints (4-5 sprints across active projects)
        List<Sprint> sprints = new ArrayList<>();
        
        // Sprints for Project 0 (E-Commerce Re-platform) - IN_PROGRESS
        Sprint ecomSprint1 = Sprint.builder()
                .name("Ecom Sprint 1: Setup")
                .project(projects.get(0))
                .startDate(today.minusDays(28))
                .endDate(today.minusDays(14))
                .status(SprintStatus.COMPLETED)
                .goal("Initialize repo, setup database and routing structures.")
                .build();
        sprints.add(sprintRepository.save(ecomSprint1));

        Sprint ecomSprint2 = Sprint.builder()
                .name("Ecom Sprint 2: Core API")
                .project(projects.get(0))
                .startDate(today.minusDays(13))
                .endDate(today.plusDays(1))
                .status(SprintStatus.ACTIVE)
                .goal("Complete shopping cart and order processing endpoints.")
                .build();
        sprints.add(sprintRepository.save(ecomSprint2));

        // Sprints for Project 1 (Mobile App v2.0) - IN_PROGRESS
        Sprint mobileSprint1 = Sprint.builder()
                .name("Mobile Sprint 1: Design Sync")
                .project(projects.get(1))
                .startDate(today.minusDays(14))
                .endDate(today.minusDays(1))
                .status(SprintStatus.COMPLETED)
                .goal("Export design tokens, write theme config and build login.")
                .build();
        sprints.add(sprintRepository.save(mobileSprint1));

        Sprint mobileSprint2 = Sprint.builder()
                .name("Mobile Sprint 2: Feed Integration")
                .project(projects.get(1))
                .startDate(today)
                .endDate(today.plusDays(14))
                .status(SprintStatus.ACTIVE)
                .goal("Connect to user feed APIs and render responsive screens.")
                .build();
        sprints.add(sprintRepository.save(mobileSprint2));

        // Sprint for Project 4 (Security Audit Remediation) - IN_PROGRESS
        Sprint secSprint1 = Sprint.builder()
                .name("Security Sprint 1: Patching")
                .project(projects.get(4))
                .startDate(today.minusDays(9))
                .endDate(today.plusDays(5))
                .status(SprintStatus.ACTIVE)
                .goal("Resolve top 10 OWASP vulnerability findings.")
                .build();
        sprints.add(sprintRepository.save(secSprint1));

        // 4. Create 60-80 Tasks
        Random taskRand = new Random(42);
        int totalTasksToCreate = 70;
        List<Task> allTasks = new ArrayList<>();

        String[] taskTitles = {
                "Configure database pooling", "Draft architecture diagrams", "Implement JWT auth tokens",
                "Integrate landing page layout", "Optimize postgres queries", "Design main sidebar component",
                "Create project schema scripts", "Write validation annotations", "Mock user seed dataset",
                "Resolve security audit reports", "Update project details PUT endpoint", "Set up CORS policies",
                "Fix layout responsive padding", "Install chart.js dependencies", "Build donut chart analytics",
                "Connect task status drag-drop", "Write unit tests for UserService", "Verify mapping properties",
                "Fix profile avatar uploading", "Enable Swagger OpenAPI docs", "Integrate Flyway migration scripts",
                "Implement role authorization checks", "Refactor dashboard summary logic", "Run build validation tests",
                "Update readme configuration instructions", "Configure dev server proxy rules", "Resolve styling overlaps",
                "Add toggle settings for themes", "Setup caching on filter endpoints", "Clean console logging reports"
        };

        for (int i = 0; i < totalTasksToCreate; i++) {
            // Pick a project
            int projectIdx = i % 14;
            Project project = projects.get(projectIdx);
            
            // Assign to users randomly (including PM at times)
            User assignee = users.get(taskRand.nextInt(users.size()));

            TaskStatus status;
            if (project.getStatus() == ProjectStatus.COMPLETED) {
                status = TaskStatus.DONE;
            } else if (project.getStatus() == ProjectStatus.CANCELLED) {
                status = taskRand.nextBoolean() ? TaskStatus.TODO : TaskStatus.DONE;
            } else if (project.getStatus() == ProjectStatus.PLANNING) {
                status = TaskStatus.TODO;
            } else {
                // In Progress or On Hold
                status = TaskStatus.values()[taskRand.nextInt(TaskStatus.values().length)];
            }

            TaskPriority priority = TaskPriority.values()[taskRand.nextInt(TaskPriority.values().length)];
            int storyPoints = 1 + taskRand.nextInt(8); // 1 to 8 SP

            // Pick a sprint if project matches sprint projects
            Sprint sprint = null;
            if (projectIdx == 0) {
                sprint = taskRand.nextBoolean() ? ecomSprint1 : ecomSprint2;
            } else if (projectIdx == 1) {
                sprint = taskRand.nextBoolean() ? mobileSprint1 : mobileSprint2;
            } else if (projectIdx == 4) {
                sprint = secSprint1;
            }

            // Completed date
            Instant completedAt = null;
            if (status == TaskStatus.DONE) {
                completedAt = Instant.now().minus(taskRand.nextInt(15), ChronoUnit.DAYS);
            }

            // Title
            String title = taskTitles[i % taskTitles.length] + " [Task " + i + "]";

            Task task = Task.builder()
                    .title(title)
                    .description("Detailed requirements for " + title + ". All code must adhere to architectural patterns.")
                    .status(status)
                    .priority(priority)
                    .storyPoints(storyPoints)
                    .assignedTo(assignee)
                    .project(project)
                    .sprint(sprint)
                    .dueDate(today.plusDays(-10 + taskRand.nextInt(35)))
                    .completedAt(completedAt)
                    .build();

            task.setCreatedAt(Instant.now().minus(20 + taskRand.nextInt(15), ChronoUnit.DAYS));
            allTasks.add(taskRepository.save(task));

            // Seed comments on every 4th task
            if (i % 4 == 0) {
                commentRepository.save(Comment.builder()
                        .task(task)
                        .author(users.get(taskRand.nextInt(users.size())))
                        .content("This task needs solid test cases. Let's make sure edge cases are covered.")
                        .createdAt(task.getCreatedAt().plus(1, ChronoUnit.HOURS))
                        .build());
            }
        }

        // Recalculate progress for all projects based on the tasks we just created
        for (Project p : projects) {
            projectService.recalculateProjectProgress(p.getId());
        }

        // 5. Create Activity Log Entries for the last 30 days
        String[] actions = {"CREATE", "UPDATE", "STATUS_CHANGE", "MEMBER_ASSIGN", "START", "COMPLETE"};
        String[] entityTypes = {"Project", "Task", "Sprint"};
        
        for (int i = 0; i < 40; i++) {
            int entityId = 1 + taskRand.nextInt(10);
            String type = entityTypes[taskRand.nextInt(entityTypes.length)];
            String act = actions[taskRand.nextInt(actions.length)];
            User performer = users.get(taskRand.nextInt(users.size()));

            activityLogRepository.save(ActivityLog.builder()
                    .entityType(type)
                    .entityId((long) entityId)
                    .action(act)
                    .performedBy(performer)
                    .description("Performed " + act + " action on resource " + type + " #" + entityId)
                    .timestamp(Instant.now().minus(taskRand.nextInt(30), ChronoUnit.DAYS))
                    .build());
        }

        System.out.println("Seeding complete. Seeding success.");
    }
}
