package com.ahmedelsawi.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ahmedelsawi.api.Auth.CurrentUserService;
import com.ahmedelsawi.api.Auth.Role;
import com.ahmedelsawi.api.Auth.User;
import com.ahmedelsawi.api.tickets.Ticket;
import com.ahmedelsawi.api.tickets.TicketNotFoundException;
import com.ahmedelsawi.api.tickets.TicketRepository;
import com.ahmedelsawi.api.tickets.TicketService;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private CurrentUserService currentUserService;

    private TicketService ticketService;
    private Ticket ticket;
    private User currentUser;

    @BeforeEach
    void setUp() {
        ticketService = new TicketService(ticketRepository, currentUserService);

        currentUser = user(1L, Role.AGENT);
        when(currentUserService.requireCurrentUser()).thenReturn(currentUser);

        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setSubject("Test");
        ticket.setDescription("Test Description");
        ticket.setCreatedBy(1L);
        ticket.setStatus("Open");
        ticket.setPriority("Medium");
    }

    @Test
    void getTicketById_found() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        Ticket result = ticketService.getTicket(1L);

        assertNotNull(result);
        assertEquals("Test", result.getSubject());
        assertEquals(1L, result.getId());
    }

    @Test
    void getTicketById_notfound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(TicketNotFoundException.class, () -> ticketService.getTicket(1L));
    }

    @Test
    void createTicket_setsServerOwnedDefaults() {
        Ticket newTicket = new Ticket();
        newTicket.setSubject("New ticket");
        newTicket.setDescription("Needs help");
        newTicket.setStatus("Resolved");
        newTicket.setPriority("High");
        newTicket.setCreatedAt(Instant.parse("2020-01-01T00:00:00Z"));

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket result = ticketService.createTicket(newTicket);

        assertEquals("Open", result.getStatus());
        assertEquals("High", result.getPriority());
        assertEquals(1L, result.getCreatedBy());
        assertNull(result.getResolvedAt());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void getAllTickets_forAgentReturnsAllTickets() {
        when(ticketRepository.findAll()).thenReturn(List.of(ticket));

        List<Ticket> result = ticketService.getAllTickets();

        assertEquals(1, result.size());
    }

    @Test
    void getAllTickets_forRequesterReturnsOwnTickets() {
        currentUser = user(1L, Role.REQUESTER);
        when(currentUserService.requireCurrentUser()).thenReturn(currentUser);
        when(ticketRepository.findByCreatedBy(1L)).thenReturn(List.of(ticket));

        List<Ticket> result = ticketService.getAllTickets();

        assertEquals(1, result.size());
    }

    @Test
    void updateTicket_updatesStatusAndResolvedAt() {
        Ticket updates = new Ticket();
        updates.setStatus("Resolved");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket result = ticketService.updateTicket(1L, updates);

        assertEquals("Resolved", result.getStatus());
        assertNotNull(result.getResolvedAt());
        assertNotNull(result.getUpdatedAt());
    }

    private User user(Long id, Role role) {
        User user = new User();
        setUserId(user, id);
        user.setEmail("user@example.com");
        user.setFullName("Test User");
        user.setRole(role);
        return user;
    }

    private void setUserId(User user, Long id) {
        try {
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("Unable to set test user id", ex);
        }
    }
}
