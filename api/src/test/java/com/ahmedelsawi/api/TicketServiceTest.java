package com.ahmedelsawi.api;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ahmedelsawi.api.tickets.Ticket;
import com.ahmedelsawi.api.tickets.TicketNotFoundException;
import com.ahmedelsawi.api.tickets.TicketRepository;
import com.ahmedelsawi.api.tickets.TicketService;

import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class TicketServiceTest {
    @Mock
    private TicketRepository ticketRepository;

    @InjectMocks
    private TicketService ticketService;

    private Ticket ticket; 

    @BeforeEach
    void setUp() {
        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setSubject("Test");
        ticket.setDescription("Test Description");
        ticket.setCreatedBy(1L); 
    }

    @Test
    void getTicketById_found(){
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        Ticket result = ticketService.getTicket(1L);

        assertNotNull(result);
        assertEquals("Test", result.getSubject());
        assertEquals(1L, result.getId());

    }

    @Test
    void getTicketById_notfound(){
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(TicketNotFoundException.class, () -> ticketService.getTicket(1L));
    }

    @Test
    void createTicket_setsDefaultStatus() {
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);

        Ticket result = ticketService.createTicket(ticket);

        assertEquals("NOT_STARTED", result.getStatus());
    }

    @Test
    void getAllTickets_returnsList() {
        when(ticketRepository.findAll()).thenReturn(List.of(ticket));

        List<Ticket> result = ticketService.getAllTickets();

        assertEquals(1, result.size());
    }

    @Test
    void updateTicket_updatesStatus() {
        Ticket updates = new Ticket();
        updates.setStatus("IN_PROGRESS");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);

        Ticket result = ticketService.updateTicket(1L, updates);

        assertEquals("IN_PROGRESS", result.getStatus());
    }
    
}
