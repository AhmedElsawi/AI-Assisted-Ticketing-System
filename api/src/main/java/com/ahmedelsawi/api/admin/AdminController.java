package com.ahmedelsawi.api.admin;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.ahmedelsawi.api.Auth.Role;
import com.ahmedelsawi.api.Auth.User;
import com.ahmedelsawi.api.Auth.UserRepository;
import com.ahmedelsawi.api.tickets.Ticket;
import com.ahmedelsawi.api.tickets.TicketRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(
            UserRepository userRepository,
            TicketRepository ticketRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/users")
    public List<UserResponse> getUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/users")
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.valueOf(request.role()));
        user.setStatus("Offline");

        return toResponse(userRepository.save(user));
    }

    @PatchMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.role() != null) {
            user.setRole(Role.valueOf(request.role()));
        }

        if (request.status() != null) {
            user.setStatus(request.status());
            user.setLastActiveAt(Instant.now());
        }

        return toResponse(userRepository.save(user));
    }

    @GetMapping("/metrics")
    public AdminMetrics getMetrics() {
        List<User> users = userRepository.findAll();
        List<Ticket> tickets = ticketRepository.findAll();
        Instant now = Instant.now();

        long openTickets = tickets.stream().filter(ticket -> "Open".equals(ticket.getStatus())).count();
        long overdueTickets = tickets.stream()
                .filter(ticket -> !"Resolved".equals(ticket.getStatus()) && !"Closed".equals(ticket.getStatus()))
                .filter(ticket -> ticket.getCreatedAt() != null)
                .filter(ticket -> Duration.between(ticket.getCreatedAt(), now).toHours() > 48)
                .count();
        long resolvedTickets = tickets.stream().filter(ticket -> "Resolved".equals(ticket.getStatus())).count();
        long totalAgents = users.stream().filter(user -> user.getRole() == Role.AGENT).count();
        long activeAgents = users.stream()
                .filter(user -> user.getRole() == Role.AGENT)
                .filter(user -> user.getLastActiveAt() != null)
                .filter(user -> Duration.between(user.getLastActiveAt(), now).toMinutes() <= 5)
                .count();
        int resolutionRate = tickets.isEmpty() ? 0 : Math.round((resolvedTickets * 100f) / tickets.size());

        List<AgentWorkload> workload = users.stream()
                .filter(user -> user.getRole() == Role.AGENT)
                .map(agent -> new AgentWorkload(
                        agent.getId(),
                        agent.getFullName(),
                        tickets.stream()
                                .filter(ticket -> agent.getId().equals(ticket.getAssignedTo()))
                                .filter(ticket -> !"Resolved".equals(ticket.getStatus()) && !"Closed".equals(ticket.getStatus()))
                                .count(),
                        tickets.stream()
                                .filter(ticket -> agent.getId().equals(ticket.getAssignedTo()))
                                .filter(ticket -> "Resolved".equals(ticket.getStatus()))
                                .count()))
                .sorted(Comparator.comparingLong(AgentWorkload::activeTickets).reversed())
                .toList();

        return new AdminMetrics(openTickets, overdueTickets, activeAgents, totalAgents, resolutionRate, workload);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus(),
                user.getLastActiveAt(),
                user.getCreatedAt());
    }

    public record UpdateUserRequest(String role, String status) {
    }

    public record CreateUserRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            String role,
            @NotBlank @Size(min = 8) String password) {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String role,
            String status,
            Instant lastActiveAt,
            Instant createdAt) {
    }

    public record AgentWorkload(Long agentId, String fullName, long activeTickets, long resolvedTickets) {
    }

    public record AdminMetrics(
            long openTickets,
            long overdueTickets,
            long activeAgents,
            long totalAgents,
            int resolutionRate,
            List<AgentWorkload> workload) {
    }
}
