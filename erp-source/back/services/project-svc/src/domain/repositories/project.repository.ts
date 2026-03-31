import { Project } from '../entities/project.entity';

export interface ProjectRepository {
  findById(id: string, tenantId: string): Promise<Project | null>;
  findByCode(code: string, tenantId: string): Promise<Project | null>;
  findByTenant(tenantId: string): Promise<Project[]>;
  findByManager(managerId: string, tenantId: string): Promise<Project[]>;
  findByStatus(status: string, tenantId: string): Promise<Project[]>;
  save(project: Project): Promise<Project>;
  update(project: Project): Promise<Project>;
  nextProjectCode(tenantId: string): Promise<string>;
  existsByCode(code: string, tenantId: string): Promise<boolean>;
  saveWithOutbox(project: Project): Promise<Project>;
}

export const PROJECT_REPOSITORY = Symbol('ProjectRepository');
