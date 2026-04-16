package com.ahmedelsawi.api.tickets;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

@Entity
@Table(name = "tickets")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String subject;
    @NotBlank
    private String description; 
    private String status; 
    private String priority; 


    @Column(name = "created_by")
    private Long createdBy; 
    @Column(name = "assigned_to")
    private Long assignedTo; 
    @Column(name = "created_at")
    private Instant createdAt; 
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public Ticket(){

    }

    public Long getId(){
        return id;
    }

    public String getSubject(){
        return subject; 
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public String getPriority(){
        return priority;
    }

    public Long getCreatedBy(){
        return createdBy;
    }

    public Long getAssignedTo(){
        return assignedTo;
    }

    public Instant getCreatedAt(){
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setId(long id){
        this.id = id;
    }

    public void setSubject(String subject){
        this.subject = subject; 
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStatus(String status) {
        this.status = status; 
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public void setAssignedTo(Long assignedTo){
        this.assignedTo = assignedTo; 
    }

    public void setCreatedAt(Instant createdAt) {
       this.createdAt = createdAt; 
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

}
