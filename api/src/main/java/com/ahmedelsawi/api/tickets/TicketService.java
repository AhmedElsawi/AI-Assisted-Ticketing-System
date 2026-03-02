package com.ahmedelsawi.api.tickets;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class TicketService {

    private final TicketRepository repo;

    public TicketService(TicketRepository repo){
        this.repo = repo;
    }

    public List<Ticket> getAllTickets() {
        return repo.findAll();
    }

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

    public Ticket getTicket(Long id) {
        return repo.findById(id).orElseThrow(() -> new TicketNotFoundException(id));
    }

    public Ticket updateTicket( Long id, Ticket updates){
         Ticket ticket = getTicket(id);

        if (updates.getStatus() != null) {
            ticket.setStatus(updates.getStatus());
        }

        if (updates.getPriority() != null) {
            ticket.setPriority(updates.getPriority());
        }

        if (updates.getAssignedTo() != null) {
            ticket.setAssignedTo(updates.getAssignedTo());
        }

       return repo.save(ticket);

    }

    public void deleteTicket(Long id) {
        if (!repo.existsById(id)) {
            throw new TicketNotFoundException(id);
        }
        repo.deleteById(id);
    }
    
}
