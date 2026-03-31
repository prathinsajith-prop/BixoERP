import { Injectable } from '@nestjs/common';
import { ApprovalRequest } from '../entities/approval-request.entity';
import { ApprovalStep } from '../entities/approval-step.entity';
import { WorkflowDefinition, WorkflowStepDefinition } from '../entities/workflow-definition.entity';
import { DelegationRule } from '../entities/delegation-rule.entity';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';

@Injectable()
export class ApprovalEngine {
  /**
   * Build the initial approval steps from a workflow definition.
   */
  buildSteps(requestId: string, definition: WorkflowDefinition): ApprovalStep[] {
    return definition.steps.map((stepDef) =>
      ApprovalStep.create({
        requestId,
        stepOrder: stepDef.stepOrder,
        stepName: stepDef.name,
        approverUserIds: [...stepDef.approverUserIds],
        approverRoleIds: [...stepDef.approverRoleIds],
      }),
    );
  }

  /**
   * Resolve the effective approver: if a delegation rule exists, return the delegate.
   */
  resolveApprover(
    userId: string,
    entityType: string,
    delegationRules: DelegationRule[],
  ): { effectiveUserId: string; delegatedFrom: string | null } {
    const now = new Date();
    const rule = delegationRules.find(
      (r) =>
        r.fromUserId === userId &&
        r.isEffective(now) &&
        r.appliesToEntityType(entityType),
    );

    if (rule) {
      return { effectiveUserId: rule.toUserId, delegatedFrom: userId };
    }
    return { effectiveUserId: userId, delegatedFrom: null };
  }

  /**
   * Check whether the current step should be auto-escalated based on time.
   */
  shouldAutoEscalate(
    request: ApprovalRequest,
    definition: WorkflowDefinition,
  ): boolean {
    const stepDef = definition.getStepByOrder(request.currentStepOrder);
    if (!stepDef || !stepDef.autoEscalateAfterHours) return false;

    const currentStep = request.currentStep;
    if (!currentStep || !currentStep.isPending) return false;

    const createdAt = currentStep.createdAt;
    const deadlineMs = stepDef.autoEscalateAfterHours * 60 * 60 * 1000;
    return Date.now() - createdAt.getTime() > deadlineMs;
  }
}
