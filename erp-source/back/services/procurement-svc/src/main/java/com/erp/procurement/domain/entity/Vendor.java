package com.erp.procurement.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class Vendor {

    private UUID id;
    private UUID tenantId;
    private String code;
    private String name;
    private String taxId;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private int paymentTerms;
    private String currency;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static Vendor create(UUID tenantId, String code, String name, String taxId,
                                String email, String phone, String address, String city,
                                String country, int paymentTerms, String currency) {
        return Vendor.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .code(code)
                .name(name)
                .taxId(taxId)
                .email(email)
                .phone(phone)
                .address(address)
                .city(city)
                .country(country)
                .paymentTerms(paymentTerms)
                .currency(currency)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = Instant.now();
    }

    public void activate() {
        this.active = true;
        this.updatedAt = Instant.now();
    }

    public void update(String name, String email, String phone, String address,
                       String city, String country, int paymentTerms) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.country = country;
        this.paymentTerms = paymentTerms;
        this.updatedAt = Instant.now();
    }
}
