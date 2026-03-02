package com.ahmedelsawi.api.tickets;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@RestController
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @GetMapping("/tickets")
    public List<Ticket> getAllTickets() {
        return service.getAllTickets();
    }

    @GetMapping("/tickets/{id}")
    public Ticket getTicket(@PathVariable Long id) {
        return service.getTicket(id);
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

}
  
