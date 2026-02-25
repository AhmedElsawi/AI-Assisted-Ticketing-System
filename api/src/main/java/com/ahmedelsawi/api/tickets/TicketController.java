package com.ahmedelsawi.api.tickets;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
public class TicketController {
    private final TicketRepository repo;

    public TicketController(TicketRepository repo){
        this.repo = repo;

    }

    @GetMapping("/tickets")
    public List<Ticket> getAllTickets() {
        return repo.findAll();
    }

  
    @GetMapping("/tickets/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable Long id) {
        Optional<Ticket> optionalTicket = repo.findById(id);

        if (optionalTicket.isPresent()) {
            return ResponseEntity.ok(optionalTicket.get());
        } else {
            return ResponseEntity.notFound().build(); 
        }
    }


    @PostMapping("/tickets")
    public Ticket createTicket(@RequestBody Ticket ticket){
        if (ticket.getStatus() == null){
            ticket.setStatus("Open");
        }

        if (ticket.getPriority() == null){ 
             ticket.setPriority("Medium");
        }

        if (ticket.getCreatedAt() == null){
             ticket.setCreatedAt(Instant.now());
        }

        return repo.save(ticket);
    }

    @PatchMapping("/tickets/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Long id, @RequestBody Ticket updates){
         Optional<Ticket> optionalTicket = repo.findById(id);

        if (!optionalTicket.isPresent()) {
            return ResponseEntity.notFound().build(); // 404 instead of throwing 500
        }

        Ticket ticket = optionalTicket.get();


        if (updates.getStatus() != null) {
            ticket.setStatus(updates.getStatus());
        }

        if (updates.getPriority() != null) {
            ticket.setPriority(updates.getPriority());
        }

        if (updates.getAssignedTo() != null) {
            ticket.setAssignedTo(updates.getAssignedTo());
        }

        Ticket saved = repo.save(ticket);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/tickets/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        if (!repo.existsById(id)) { 
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build(); 
    }
}
  
