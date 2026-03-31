package com.erp.manufacturing.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class ScheduleWorkOrderRequest {

    @NotNull
    private Instant scheduledStart;

    @NotNull
    private Instant scheduledEnd;

    private String productionLine;
}
