package com.ahmedelsawi.api.tickets;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ahmedelsawi.api.Auth.User;
import com.ahmedelsawi.api.Auth.UserRepository;

@RestController
public class TicketController {

    private final TicketService service;
    private final UserRepository userRepository;

    public TicketController(TicketService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping("/tickets")
    public List<TicketResponse> getAllTickets() {
        return toResponses(service.getAllTickets());
    }

    @GetMapping("/tickets/{id}")
    public TicketResponse getTicket(@PathVariable Long id) {
        return toResponse(service.getTicket(id));
    }

    @PostMapping("/tickets")
    public Ticket createTicket(@Valid @RequestBody Ticket ticket){
        return service.createTicket(ticket);
    }

    @PatchMapping("/tickets/{id}")
    public Ticket updateTicket(@PathVariable Long id, @RequestBody Ticket updates){
        return service.updateTicket(id, updates);
    }

    @DeleteMapping("/tickets/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        service.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    private List<TicketResponse> toResponses(List<Ticket> tickets) {
        List<Long> userIds = tickets.stream()
                .flatMap(ticket -> java.util.stream.Stream.of(ticket.getCreatedBy(), ticket.getAssignedTo()))
                .filter(id -> id != null)
                .distinct()
                .toList();

        Map<Long, String> namesById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));

        return tickets.stream()
                .map(ticket -> toResponse(ticket, namesById))
                .toList();
    }

    private TicketResponse toResponse(Ticket ticket) {
        List<Long> userIds = java.util.stream.Stream.of(ticket.getCreatedBy(), ticket.getAssignedTo())
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, String> namesById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));

        return toResponse(ticket, namesById);
    }

    private TicketResponse toResponse(Ticket ticket, Map<Long, String> namesById) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getSubject(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getCreatedBy(),
                namesById.get(ticket.getCreatedBy()),
                ticket.getAssignedTo(),
                ticket.getAssignedTo() == null ? null : namesById.get(ticket.getAssignedTo()),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt());
    }

    public record TicketResponse(
            Long id,
            String subject,
            String description,
            String status,
            String priority,
            Long createdBy,
            String createdByName,
            Long assignedTo,
            String assignedToName,
            java.time.Instant createdAt,
            java.time.Instant updatedAt,
            java.time.Instant resolvedAt) {
    }

}
  
