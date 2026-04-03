# Ticketing System

A full-stack backend ticketing system built with Spring Boot that allows users to create, track, and manage support tickets. The system is designed with real-world architecture principles and is currently being extended with authentication, role-based access control, and automation features.

---

## How it works and current features 

- Create support tickets
- View all tickets in an admin dashboard
- Update ticket status
- Basic backend REST API structure
- PostgreSQL database integration
- Input validation using Bean Validation
- Initial unit testing setup

---

## What I'm working on 

- JWT-based authentication system
- User registration and login
- Role-based access control (USER / ADMIN)
- Secure API endpoints
- Improved admin workflow for ticket management

---

## Next Steps and how to improve 

### AI & Automation
- AI-powered ticket categorization 
- Priority prediction (low / medium / high)
- Auto-generated admin responses
- Ticket summarization using LLMs

### DevOps 
- CI/CD pipeline using GitHub Actions
- Automated testing on every push
- Continuous deployment to cloud hosting
- Environment-based configuration (dev / prod)

### Deployment
- Backend deployment to cloud platform
- Production-ready database setup
- API documentation (Swagger/OpenAPI)

### Frontend
- React-based dashboard for users and admins
- Ticket creation and tracking UI
- Admin control panel

---

## Tech Stack

### Backend
- Java 17
- Spring Boot
- Spring Data JPA
- Spring Security (in progress)
- Hibernate

### Database
- PostgreSQL

### Testing
- JUnit (basic setup)

### Build Tool
- Maven

---

## API Overview (Current)

> (Expanding as project evolves)

| Method | Endpoint        | Description              |
|--------|----------------|--------------------------|
| POST   | /tickets        | Create a new ticket      |
| GET    | /tickets        | Get all tickets          |
| GET    | /tickets/{id}   | Get ticket by ID         |
| PUT    | /tickets/{id}   | Update ticket status     |
