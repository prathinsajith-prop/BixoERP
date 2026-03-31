import { ApprovalRequest } from '../../../src/domain/entities/approval-request.entity';
import { ApprovalStep } from '../../../src/domain/entities/approval-step.entity';
import { ApprovalStatus } from '../../../src/domain/value-objects/approval-status';
import { WorkflowAlreadyCompletedException, UnauthorizedApproverException } from '../../../src/domain/exceptions/domain.exceptions';

describe('ApprovalRequest', () => {
  const buildRequest = () => {
    const steps = [
      ApprovalStep.create({
        requestId: 'req-1',
        stepOrder: 1,
        stepName: 'Manager Approval',
        approverUserIds: ['user-approver-1'],
        approverRoleIds: ['MANAGER'],
      }),
      ApprovalStep.create({
        requestId: 'req-1',
        stepOrder: 2,
        stepName: 'Director Approval',
        approverUserIds: ['user-approver-2'],
        approverRoleIds: ['DIRECTOR'],
      }),
    ];

    return ApprovalRequest.create({
      workflowDefinitionId: 'def-1',
      entityType: 'PURCHASE_ORDER',
      entityId: 'po-1',
      tenantId: 'tenant-1',
      requestedBy: 'user-requester',
      totalSteps: 2,
      steps,
      metadata: { amount: 50000 },
    });
  };

  it('should create a PENDING request with domain event', () => {
    const request = buildRequest();
    expect(request.status).toBe(ApprovalStatus.PENDING);
    expect(request.currentStepOrder).toBe(1);
    expect(request.totalSteps).toBe(2);
    expect(request.domainEvents).toHaveLength(1);
    expect(request.domainEvents[0].eventType).toBe('workflow.approval.needed');
  });

  it('should advance to step 2 after approving step 1', () => {
    const request = buildRequest();
    request.approveCurrentStep('user-approver-1', ['MANAGER'], 'Looks good', null);

    expect(request.currentStepOrder).toBe(2);
    expect(request.status).toBe(ApprovalStatus.PENDING);
    expect(request.domainEvents).toHaveLength(2);
  });

  it('should mark as APPROVED when last step is approved', () => {
    const request = buildRequest();
    request.approveCurrentStep('user-approver-1', ['MANAGER'], null, null);
    request.approveCurrentStep('user-approver-2', ['DIRECTOR'], null, null);

    expect(request.status).toBe(ApprovalStatus.APPROVED);
    expect(request.completedAt).toBeTruthy();
  });

  it('should mark as REJECTED when any step is rejected', () => {
    const request = buildRequest();
    request.rejectCurrentStep('user-approver-1', ['MANAGER'], 'Budget too high');

    expect(request.status).toBe(ApprovalStatus.REJECTED);
    expect(request.completedAt).toBeTruthy();
  });

  it('should throw when unauthorized approver tries to approve', () => {
    const request = buildRequest();
    expect(() =>
      request.approveCurrentStep('random-user', [], null, null),
    ).toThrow(UnauthorizedApproverException);
  });

  it('should throw when trying to approve a completed request', () => {
    const request = buildRequest();
    request.cancel('user-requester');
    expect(() =>
      request.approveCurrentStep('user-approver-1', ['MANAGER'], null, null),
    ).toThrow(WorkflowAlreadyCompletedException);
  });

  it('should support escalation', () => {
    const request = buildRequest();
    request.escalate('Overdue');
    expect(request.status).toBe(ApprovalStatus.ESCALATED);
  });

  it('should allow approval with delegation', () => {
    const request = buildRequest();
    request.approveCurrentStep('delegate-user', ['MANAGER'], 'Delegated approval', 'user-approver-1');

    expect(request.currentStepOrder).toBe(2);
  });
});
