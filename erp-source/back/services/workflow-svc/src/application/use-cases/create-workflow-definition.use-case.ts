import { Injectable, Inject } from '@nestjs/common';
import { WorkflowDefinition } from '../../domain/entities/workflow-definition.entity';
import {
  WorkflowDefinitionRepository,
  WORKFLOW_DEFINITION_REPOSITORY,
} from '../../domain/repositories/workflow-definition.repository';
import { DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { WorkflowStepType } from '../../domain/value-objects/workflow-step-type';

export interface CreateWorkflowDefinitionInput {
  code: string;
  name: string;
  description: string | null;
  entityType: string;
  steps: Array<{
    stepOrder: number;
    name: string;
    stepType: WorkflowStepType;
    approverUserIds: string[];
    approverRoleIds: string[];
    autoEscalateAfterHours: number | null;
    conditions: Record<string, unknown> | null;
  }>;
  tenantId: string;
  createdBy: string;
}

export interface CreateWorkflowDefinitionOutput {
  id: string;
  code: string;
  name: string;
  entityType: string;
  totalSteps: number;
}

@Injectable()
export class CreateWorkflowDefinitionUseCase {
  constructor(
    @Inject(WORKFLOW_DEFINITION_REPOSITORY)
    private readonly definitionRepo: WorkflowDefinitionRepository,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: CreateWorkflowDefinitionInput): Promise<CreateWorkflowDefinitionOutput> {
    const existing = await this.definitionRepo.findByCode(input.code, input.tenantId);
    if (existing) {
      throw new DuplicateEntryException('workflow_definition_code', input.code);
    }

    const definition = WorkflowDefinition.create({
      code: input.code,
      name: input.name,
      description: input.description,
      entityType: input.entityType,
      steps: input.steps,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    const saved = await this.definitionRepo.save(definition);
    await this.cache.del(`definitions:${input.tenantId}`);

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      entityType: saved.entityType,
      totalSteps: saved.totalSteps,
    };
  }
}
