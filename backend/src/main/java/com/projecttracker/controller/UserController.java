package com.projecttracker.controller;

import com.projecttracker.dto.ApiResponse;
import com.projecttracker.dto.UserDto;
import com.projecttracker.dto.UserStatsDto;
import com.projecttracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user, "User profile retrieved"));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ApiResponse<UserStatsDto>> getUserStats(@PathVariable Long id) {
        UserStatsDto stats = userService.getUserStats(id);
        return ResponseEntity.ok(ApiResponse.success(stats, "User statistics retrieved"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUserProfile(@PathVariable Long id, @RequestBody UserDto userDto) {
        UserDto updatedUser = userService.updateUserProfile(id, userDto);
        return ResponseEntity.ok(ApiResponse.success(updatedUser, "User profile updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }
}
