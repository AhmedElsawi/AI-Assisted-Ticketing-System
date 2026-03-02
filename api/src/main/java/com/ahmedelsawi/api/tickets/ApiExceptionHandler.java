package com.ahmedelsawi.api.tickets;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.validation.FieldError;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestControllerAdvice

public class ApiExceptionHandler {

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
    Map<String, Object> response = new HashMap<>();
    Map<String, String> fieldErrors = new HashMap<>();

    addFieldErrors(fieldErrors, ex.getBindingResult().getFieldErrors());

    response.put("error", "Validation Failed");
    response.put("fields", fieldErrors);

    return ResponseEntity.badRequest().body(response);
}

    private void addFieldErrors(
            Map<String, String> fieldErrors,
            List<FieldError> errors
    ) {
        for (int i = 0; i < errors.size(); i++) {
            FieldError err = errors.get(i);
            fieldErrors.put(err.getField(), err.getDefaultMessage());
        }
    }


    @ExceptionHandler(TicketNotFoundException.class)

    public ResponseEntity<Map<String, Object>> handleTicketNotFound(TicketNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of( "error", "Not Found","message", ex.getMessage() ));
    }

}

