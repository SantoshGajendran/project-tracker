package com.projecttracker.controller;

import com.projecttracker.config.JwtTokenProvider;
import com.projecttracker.dto.*;
import com.projecttracker.entity.User;
import com.projecttracker.mapper.UserMapper;
import com.projecttracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        User user = (User) authentication.getPrincipal();
        
        AuthResponse authResponse = AuthResponse.builder()
                .token(jwt)
                .user(userMapper.toDto(user))
                .build();

        return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = userService.registerUser(registerRequest);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(user), "User registered successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDto(user), "Current user retrieved"));
    }
}
