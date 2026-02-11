package com.ahmedelsawi.api.tickets;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

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
    public Ticket getTicket(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }

    @PostMapping("/tickets")
    public Ticket createTicket(@RequestBody Ticket ticket){
        if (ticket.getStatus() == null) ticket.setStatus("Open");
        if (ticket.getPriority() == null) ticket.setPriority("Medium");
        if (ticket.getCreatedAt() == null) ticket.setCreatedAt(Instant.now());
        return repo.save(ticket);
    }


    
}
