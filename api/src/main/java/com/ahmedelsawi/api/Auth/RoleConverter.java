package com.ahmedelsawi.api.Auth;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.getDatabaseValue();
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        return value == null ? null : Role.fromDatabaseValue(value);
    }
}
