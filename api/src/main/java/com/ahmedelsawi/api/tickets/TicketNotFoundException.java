package com.ahmedelsawi.api.tickets;

public class TicketNotFoundException extends RuntimeException {

    public TicketNotFoundException(Long id) {
        super("Ticket not found: " + id);
    }
}