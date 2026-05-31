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

        System.out.println("Seeding database with PM admin user...");

        // PM User
        User pm = User.builder()
                .name("Sarah Jenkins")
                .email("pm@projecttracker.com")
                .password(passwordEncoder.encode("password"))
                .role(UserRole.MANAGER)
                .avatar("")
                .createdAt(Instant.now())
                .build();
        userRepository.save(pm);

        System.out.println("PM Admin user seeded successfully.");
    }
}
