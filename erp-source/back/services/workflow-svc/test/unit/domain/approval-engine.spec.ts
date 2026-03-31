import { ApprovalEngine } from '../../../src/domain/services/approval-engine.service';
import { WorkflowDefinition } from '../../../src/domain/entities/workflow-definition.entity';
import { DelegationRule } from '../../../src/domain/entities/delegation-rule.entity';
import { WorkflowStepType } from '../../../src/domain/value-objects/workflow-step-type';

describe('ApprovalEngine', () => {
  let engine: ApprovalEngine;

  beforeEach(() => {
    engine = new ApprovalEngine();
  });

  const buildDefinition = () =>
    WorkflowDefinition.create({
      code: 'PO-APPROVAL',
      name: 'PO Approval Flow',
      description: null,
      entityType: 'PURCHASE_ORDER',
      steps: [
        {
          stepOrder: 1,
          name: 'Manager',
          stepType: WorkflowStepType.SINGLE_APPROVER,
          approverUserIds: ['mgr-1'],
          approverRoleIds: ['MANAGER'],
          autoEscalateAfterHours: 24,
          conditions: null,
        },
        {
          stepOrder: 2,
          name: 'Director',
          stepType: WorkflowStepType.SINGLE_APPROVER,
          approverUserIds: ['dir-1'],
          approverRoleIds: ['DIRECTOR'],
          autoEscalateAfterHours: 48,
          conditions: null,
        },
      ],
      tenantId: 'tenant-1',
      createdBy: 'admin',
    });

  it('should build steps from workflow definition', () => {
    const def = buildDefinition();
    const steps = engine.buildSteps('req-1', def);

    expect(steps).toHaveLength(2);
    expect(steps[0].stepOrder).toBe(1);
    expect(steps[0].stepName).toBe('Manager');
    expect(steps[1].stepOrder).toBe(2);
  });

  it('should resolve delegation correctly', () => {
    const rule = DelegationRule.create({
      fromUserId: 'mgr-1',
      toUserId: 'delegate-1',
      tenantId: 'tenant-1',
      entityType: null,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
    });

    const result = engine.resolveApprover('mgr-1', 'PURCHASE_ORDER', [rule]);
    expect(result.effectiveUserId).toBe('delegate-1');
    expect(result.delegatedFrom).toBe('mgr-1');
  });

  it('should return original user when no delegation exists', () => {
    const result = engine.resolveApprover('mgr-1', 'PURCHASE_ORDER', []);
    expect(result.effectiveUserId).toBe('mgr-1');
    expect(result.delegatedFrom).toBeNull();
  });
});
