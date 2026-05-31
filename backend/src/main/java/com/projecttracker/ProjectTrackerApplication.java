package com.projecttracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

@SpringBootApplication
public class ProjectTrackerApplication {

    public static void main(String[] args) {
        ensureDatabaseExists();
        SpringApplication.run(ProjectTrackerApplication.class, args);
    }

    private static void ensureDatabaseExists() {
        String url = "jdbc:postgresql://localhost:5432/postgres";
        String dbName = "project_tracker";
        String user = "postgres";
        String password = "Saazvat@123";

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(url, user, password);
                 Statement stmt = conn.createStatement()) {
                
                String checkQuery = "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'";
                try (ResultSet rs = stmt.executeQuery(checkQuery)) {
                    if (!rs.next()) {
                        System.out.println("Database " + dbName + " does not exist. Creating database...");
                        stmt.executeUpdate("CREATE DATABASE " + dbName);
                        System.out.println("Database " + dbName + " created successfully.");
                    } else {
                        System.out.println("Database " + dbName + " already exists.");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error verifying or creating database: " + e.getMessage());
            // Do not fail startup entirely, it might be due to connection issues or permissions, 
            // let Hibernate / Flyway try anyway and fail if appropriate
        }
    }
}
