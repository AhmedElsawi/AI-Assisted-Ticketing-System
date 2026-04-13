package com.ahmedelsawi.api.Auth;

public enum Role {
    ADMIN("Admin"),
    AGENT("Agent"),
    REQUESTER("Requester");

    private final String databaseValue;

    Role(String databaseValue) {
        this.databaseValue = databaseValue;
    }

    public String getDatabaseValue() {
        return databaseValue;
    }

    public static Role fromDatabaseValue(String value) {
        for (Role role : values()) {
            if (role.databaseValue.equalsIgnoreCase(value)) {
                return role;
            }
        }

        throw new IllegalArgumentException("Unknown role: " + value);
    }
}
