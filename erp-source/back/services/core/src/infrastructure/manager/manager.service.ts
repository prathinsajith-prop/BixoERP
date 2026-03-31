import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { ManagerAssignmentOrmEntity } from '../persistence/entity/manager-assignment.orm-entity';
import { ManagerSettingsOrmEntity } from '../persistence/entity/manager-settings.orm-entity';

export type ManagerRole = 'manager' | 'assistant_manager';
export type EntityType = 'division' | 'department' | 'team';

export interface AssignManagerCmd {
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  role: ManagerRole;
}

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(ManagerAssignmentOrmEntity)
    private readonly assignRepo: Repository<ManagerAssignmentOrmEntity>,
    @InjectRepository(ManagerSettingsOrmEntity)
    private readonly settingsRepo: Repository<ManagerSettingsOrmEntity>,
  ) {}

  // ─── Assignments ──────────────────────────────────────────

  async assign(cmd: AssignManagerCmd): Promise<ManagerAssignmentOrmEntity> {
    // If assigning 'manager', enforce single manager per entity
    if (cmd.role === 'manager') {
      const existing = await this.assignRepo.findOne({
        where: {
          tenant_id: cmd.tenantId,
          entity_type: cmd.entityType,
          entity_id: cmd.entityId,
          role: 'manager',
        },
      });
      if (existing && existing.user_id !== cmd.userId) {
        // Replace the current manager
        await this.assignRepo.remove(existing);
      }
      if (existing && existing.user_id === cmd.userId) {
        return existing; // already assigned
      }
    }

    // Check for duplicate
    const dup = await this.assignRepo.findOne({
      where: {
        tenant_id: cmd.tenantId,
        entity_type: cmd.entityType,
        entity_id: cmd.entityId,
        user_id: cmd.userId,
        role: cmd.role,
      },
    });
    if (dup) throw new ConflictException('User already assigned in this role');

    const entity = this.assignRepo.create({
      id: randomUUID(),
      tenant_id: cmd.tenantId,
      entity_type: cmd.entityType,
      entity_id: cmd.entityId,
      user_id: cmd.userId,
      role: cmd.role,
    });
    return this.assignRepo.save(entity);
  }

  async unassign(tenantId: string, assignmentId: string): Promise<void> {
    const row = await this.assignRepo.findOne({
      where: { id: assignmentId, tenant_id: tenantId },
    });
    if (!row) throw new NotFoundException('Assignment not found');
    await this.assignRepo.remove(row);
  }

  async listByEntity(
    tenantId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<ManagerAssignmentOrmEntity[]> {
    return this.assignRepo.find({
      where: { tenant_id: tenantId, entity_type: entityType, entity_id: entityId },
      order: { role: 'ASC', created_at: 'ASC' },
    });
  }

  async listByUser(tenantId: string, userId: string): Promise<ManagerAssignmentOrmEntity[]> {
    return this.assignRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      order: { entity_type: 'ASC', created_at: 'ASC' },
    });
  }

  // ─── Settings ─────────────────────────────────────────────

  async getSettings(
    tenantId: string,
    userId: string,
    entityType: string = 'global',
    entityId: string | null = null,
  ): Promise<ManagerSettingsOrmEntity | null> {
    return this.settingsRepo.findOne({
      where: { tenant_id: tenantId, user_id: userId, entity_type: entityType, entity_id: entityId ?? IsNull() },
    });
  }

  async upsertSettings(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string | null,
    settings: Partial<ManagerSettingsOrmEntity>,
  ): Promise<ManagerSettingsOrmEntity> {
    let row = await this.settingsRepo.findOne({
      where: { tenant_id: tenantId, user_id: userId, entity_type: entityType, entity_id: entityId ?? IsNull() },
    });

    if (row) {
      // Update only provided fields
      const updatable = [
        'notify_member_join', 'notify_member_leave', 'notify_task_assigned',
        'notify_approval_request', 'notify_escalation', 'notify_report_ready',
        'auto_approve_leave', 'auto_approve_expense',
        'delegate_to_user_id', 'delegation_active',
        'visible_in_directory', 'receive_weekly_summary',
      ] as const;
      for (const key of updatable) {
        if (settings[key] !== undefined) {
          (row as any)[key] = settings[key];
        }
      }
      return this.settingsRepo.save(row);
    } else {
      row = this.settingsRepo.create({
        id: randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        ...settings,
      });
      return this.settingsRepo.save(row);
    }
  }
}
