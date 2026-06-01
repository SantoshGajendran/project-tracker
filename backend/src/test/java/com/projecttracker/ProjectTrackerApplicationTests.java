package com.projecttracker;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.projecttracker.repository.UserRepository;

@SpringBootTest
class ProjectTrackerApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Test
    void contextLoads() {
        System.out.println("=== REGISTERED USERS ===");
        userRepository.findAll().forEach(user -> {
            System.out.println("EMAIL: " + user.getEmail() + " | ROLE: " + user.getRole() + " | NAME: " + user.getName());
        });
        System.out.println("========================");
    }
}
