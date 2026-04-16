package com.ahmedelsawi.api.comments;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ahmedelsawi.api.Auth.CurrentUserService;
import com.ahmedelsawi.api.Auth.User;
import com.ahmedelsawi.api.Auth.UserRepository;
import com.ahmedelsawi.api.tickets.TicketService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
public class TicketCommentController {

    private final TicketCommentRepository commentRepository;
    private final TicketService ticketService;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    public TicketCommentController(
            TicketCommentRepository commentRepository,
            TicketService ticketService,
            CurrentUserService currentUserService,
            UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
    }

    @GetMapping("/tickets/{ticketId}/comments")
    public List<CommentResponse> getComments(@PathVariable Long ticketId) {
        ticketService.getTicket(ticketId);

        List<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        Map<Long, User> authors = userRepository.findAllById(
                comments.stream().map(TicketComment::getAuthorId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return comments.stream()
                .map(comment -> toResponse(comment, authors.get(comment.getAuthorId())))
                .toList();
    }

    @PostMapping("/tickets/{ticketId}/comments")
    public CommentResponse createComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateCommentRequest request) {
        ticketService.getTicket(ticketId);
        User currentUser = currentUserService.requireCurrentUser();

        TicketComment comment = new TicketComment();
        comment.setTicketId(ticketId);
        comment.setAuthorId(currentUser.getId());
        comment.setBody(request.body().trim());
        comment.setCreatedAt(Instant.now());

        return toResponse(commentRepository.save(comment), currentUser);
    }

    private CommentResponse toResponse(TicketComment comment, User author) {
        return new CommentResponse(
                comment.getId(),
                comment.getTicketId(),
                comment.getAuthorId(),
                author == null ? "Unknown user" : author.getFullName(),
                author == null ? null : author.getRole().name(),
                comment.getBody(),
                comment.getCreatedAt());
    }

    public record CreateCommentRequest(@NotBlank String body) {
    }

    public record CommentResponse(
            Long id,
            Long ticketId,
            Long authorId,
            String authorName,
            String authorRole,
            String body,
            Instant createdAt) {
    }
}
