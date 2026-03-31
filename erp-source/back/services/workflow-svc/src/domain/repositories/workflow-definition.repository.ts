import { WorkflowDefinition } from '../entities/workflow-definition.entity';

export interface WorkflowDefinitionRepository {
  findById(id: string, tenantId: string): Promise<WorkflowDefinition | null>;
  findByCode(code: string, tenantId: string): Promise<WorkflowDefinition | null>;
  findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinition[]>;
  findAllActive(tenantId: string): Promise<WorkflowDefinition[]>;
  save(definition: WorkflowDefinition): Promise<WorkflowDefinition>;
  update(definition: WorkflowDefinition): Promise<WorkflowDefinition>;
}

export const WORKFLOW_DEFINITION_REPOSITORY = Symbol('WorkflowDefinitionRepository');
