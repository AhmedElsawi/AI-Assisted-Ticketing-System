package com.ahmedelsawi.api.tickets;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.ahmedelsawi.api.Auth.CurrentUserService;
import com.ahmedelsawi.api.Auth.Role;
import com.ahmedelsawi.api.Auth.User;

@Service
public class TicketService {

    private final TicketRepository repo;
    private final CurrentUserService currentUserService;

    public TicketService(TicketRepository repo, CurrentUserService currentUserService){
        this.repo = repo;
        this.currentUserService = currentUserService;
    }
    //Get All Tickets 
    public List<Ticket> getAllTickets() {
        User currentUser = currentUserService.requireCurrentUser();

        if (currentUser.getRole() == Role.REQUESTER) {
            return repo.findByCreatedBy(currentUser.getId());
        }

        return repo.findAll();
    }
     
    //Create Tickets
     public Ticket createTicket(Ticket ticket){
        User currentUser = currentUserService.requireCurrentUser();

        if (ticket.getStatus() == null){
            ticket.setStatus("NOT_STARTED");
        }

        if (ticket.getPriority() == null){ 
             ticket.setPriority("Medium");
        }

        if (ticket.getCreatedAt() == null){
             ticket.setCreatedAt(Instant.now());
        }

        ticket.setCreatedBy(currentUser.getId());

        if (currentUser.getRole() == Role.REQUESTER) {
            ticket.setAssignedTo(null);
        }

        return repo.save(ticket);
    }

    public Ticket getTicket(Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        Ticket ticket = repo.findById(id).orElseThrow(() -> new TicketNotFoundException(id));

        if (currentUser.getRole() == Role.REQUESTER && !ticket.getCreatedBy().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only access your own tickets");
        }

        return ticket;
    }

    //Update Tickets 
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
    //Delete Tickets 
    public void deleteTicket(Long id) {
        if (!repo.existsById(id)) {
            throw new TicketNotFoundException(id);
        }
        repo.deleteById(id);
    }
    
}
