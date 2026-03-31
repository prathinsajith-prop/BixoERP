package com.erp.manufacturing.domain.service;

import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.entity.WorkOrderStep;
import com.erp.manufacturing.domain.valueobject.Money;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Slf4j
public class ProductionCostCalculator {

    private static final BigDecimal DEFAULT_LABOR_RATE_PER_HOUR = new BigDecimal("35.00");
    private static final BigDecimal OVERHEAD_PERCENTAGE = new BigDecimal("0.15");

    public Money calculateMaterialCost(BillOfMaterials bom, BigDecimal quantity) {
        Money bomCost = bom.calculateTotalMaterialCost();
        return bomCost.multiply(quantity);
    }

    public Money calculateLaborCost(WorkOrder workOrder) {
        BigDecimal totalHours = BigDecimal.ZERO;
        for (WorkOrderStep step : workOrder.getSteps()) {
            BigDecimal hours = step.getActualHours() != null
                    ? step.getActualHours()
                    : step.getEstimatedHours();
            totalHours = totalHours.add(hours);
        }
        BigDecimal laborAmount = totalHours.multiply(DEFAULT_LABOR_RATE_PER_HOUR)
                .setScale(4, RoundingMode.HALF_UP);
        return Money.of(laborAmount, workOrder.getCurrency());
    }

    public Money calculateOverheadCost(Money materialCost, Money laborCost) {
        Money combined = materialCost.add(laborCost);
        return combined.multiply(OVERHEAD_PERCENTAGE);
    }

    public void recalculateCosts(WorkOrder workOrder, BillOfMaterials bom) {
        Money material = calculateMaterialCost(bom, workOrder.getQuantity());
        Money labor = calculateLaborCost(workOrder);
        Money overhead = calculateOverheadCost(material, labor);
        workOrder.updateCosts(material, labor, overhead);
        log.debug("Recalculated costs for WO {}: material={}, labor={}, overhead={}, total={}",
                workOrder.getOrderNumber(),
                material.getAmount(), labor.getAmount(), overhead.getAmount(),
                workOrder.getTotalCost().getAmount());
    }
}
