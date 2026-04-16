package com.ahmedelsawi.api.Auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public AuthController(
            UserRepository userRepo,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            CurrentUserService currentUserService) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return buildAuthResponse(user, token);
    }

    @PostMapping("/signup")
    public Map<String, String> signup(@Valid @RequestBody SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepo.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.REQUESTER);
        user.setStatus("Online");

        User savedUser = userRepo.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole());

        return buildAuthResponse(savedUser, token);
    }

    @PatchMapping("/me")
    public Map<String, String> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        currentUser.setFullName(request.fullName().trim());
        User savedUser = userRepo.save(currentUser);
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole());

        return buildAuthResponse(savedUser, token);
    }

    @DeleteMapping("/me")
    public void deleteMe() {
        User currentUser = currentUserService.requireCurrentUser();
        userRepo.deleteById(currentUser.getId());
    }

    private Map<String, String> buildAuthResponse(User user, String token) {
        return Map.of(
            "token", token,
            "fullName", user.getFullName(),
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "id", String.valueOf(user.getId()));
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
            String fullName) {
    }
}
