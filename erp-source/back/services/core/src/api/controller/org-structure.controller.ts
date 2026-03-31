import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guard/permissions.guard';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import { TenantId } from '../decorator/auth.decorators';
import { OrgStructureUseCase } from '../../application/use-case/org-structure.use-case';
import { ManagerService, EntityType, ManagerRole } from '../../infrastructure/manager/manager.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateDivisionDto,
  UpdateDivisionDto,
  CreateTeamDto,
  UpdateTeamDto,
  AssignManagerDto,
  UpdateManagerSettingsDto,
} from '../dto/org-structure.dto';

@Controller('api/v1/auth/org-structure')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrgStructureController {
  constructor(
    private readonly orgStructure: OrgStructureUseCase,
    private readonly managerService: ManagerService,
  ) {}

  // ─── Full Structure ────────────────────────────────────────

  @Get(':organizationId')
  @RequirePermissions('auth:org-structure:read')
  async getFullStructure(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
  ) {
    const result = await this.orgStructure.getFullStructure(tenantId, organizationId);
    return {
      statusCode: 200,
      data: {
        divisions: result.divisions.map((d) => this.mapDivision(d)),
        departments: result.departments.map((d) => this.mapDepartment(d)),
        teams: result.teams.map((t) => this.mapTeam(t)),
      },
    };
  }

  // ─── Divisions ─────────────────────────────────────────────

  @Get(':organizationId/divisions')
  @RequirePermissions('auth:org-structure:read')
  async listDivisions(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
  ) {
    const divisions = await this.orgStructure.listDivisions(tenantId, organizationId);
    return { statusCode: 200, data: divisions.map((d) => this.mapDivision(d)) };
  }

  @Post(':organizationId/divisions')
  @RequirePermissions('auth:org-structure:write')
  async createDivision(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(CreateDivisionDto)) dto: CreateDivisionDto,
  ) {
    const div = await this.orgStructure.createDivision({
      tenantId,
      organizationId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      headUserId: dto.headUserId,
    });
    return { statusCode: 201, data: this.mapDivision(div) };
  }

  @Get(':organizationId/divisions/:id')
  @RequirePermissions('auth:org-structure:read')
  async getDivision(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const div = await this.orgStructure.getDivision(tenantId, id);
    return { statusCode: 200, data: this.mapDivision(div) };
  }

  @Put(':organizationId/divisions/:id')
  @RequirePermissions('auth:org-structure:write')
  async updateDivision(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDivisionDto)) dto: UpdateDivisionDto,
  ) {
    const div = await this.orgStructure.updateDivision(tenantId, id, dto);
    return { statusCode: 200, data: this.mapDivision(div) };
  }

  @Delete(':organizationId/divisions/:id')
  @RequirePermissions('auth:org-structure:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDivision(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.orgStructure.deleteDivision(tenantId, id);
  }

  // ─── Departments ───────────────────────────────────────────

  @Get(':organizationId/departments')
  @RequirePermissions('auth:org-structure:read')
  async listDepartments(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
  ) {
    const departments = await this.orgStructure.listDepartments(tenantId, organizationId);
    return { statusCode: 200, data: departments.map((d) => this.mapDepartment(d)) };
  }

  @Post(':organizationId/departments')
  @RequirePermissions('auth:org-structure:write')
  async createDepartment(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(CreateDepartmentDto)) dto: CreateDepartmentDto,
  ) {
    const dept = await this.orgStructure.createDepartment({
      tenantId,
      organizationId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      divisionId: dto.divisionId,
      headUserId: dto.headUserId,
    });
    return { statusCode: 201, data: this.mapDepartment(dept) };
  }

  @Get(':organizationId/departments/:id')
  @RequirePermissions('auth:org-structure:read')
  async getDepartment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const dept = await this.orgStructure.getDepartment(tenantId, id);
    return { statusCode: 200, data: this.mapDepartment(dept) };
  }

  @Put(':organizationId/departments/:id')
  @RequirePermissions('auth:org-structure:write')
  async updateDepartment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDepartmentDto)) dto: UpdateDepartmentDto,
  ) {
    const dept = await this.orgStructure.updateDepartment(tenantId, id, dto);
    return { statusCode: 200, data: this.mapDepartment(dept) };
  }

  @Delete(':organizationId/departments/:id')
  @RequirePermissions('auth:org-structure:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDepartment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.orgStructure.deleteDepartment(tenantId, id);
  }

  // ─── Teams ─────────────────────────────────────────────────

  @Get(':organizationId/teams')
  @RequirePermissions('auth:org-structure:read')
  async listTeams(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const teams = departmentId
      ? await this.orgStructure.listTeamsByDepartment(tenantId, departmentId)
      : await this.orgStructure.listTeams(tenantId, organizationId);
    return { statusCode: 200, data: teams.map((t) => this.mapTeam(t)) };
  }

  @Post(':organizationId/teams')
  @RequirePermissions('auth:org-structure:write')
  async createTeam(
    @TenantId() tenantId: string,
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(CreateTeamDto)) dto: CreateTeamDto,
  ) {
    const team = await this.orgStructure.createTeam({
      tenantId,
      organizationId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      departmentId: dto.departmentId,
      leadUserId: dto.leadUserId,
    });
    return { statusCode: 201, data: this.mapTeam(team) };
  }

  @Get(':organizationId/teams/:id')
  @RequirePermissions('auth:org-structure:read')
  async getTeam(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const team = await this.orgStructure.getTeam(tenantId, id);
    return { statusCode: 200, data: this.mapTeam(team) };
  }

  @Put(':organizationId/teams/:id')
  @RequirePermissions('auth:org-structure:write')
  async updateTeam(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTeamDto)) dto: UpdateTeamDto,
  ) {
    const team = await this.orgStructure.updateTeam(tenantId, id, dto);
    return { statusCode: 200, data: this.mapTeam(team) };
  }

  @Delete(':organizationId/teams/:id')
  @RequirePermissions('auth:org-structure:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeam(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.orgStructure.deleteTeam(tenantId, id);
  }

  // ─── Manager Assignments ────────────────────────────────────

  @Get(':organizationId/:entityType/:entityId/managers')
  @RequirePermissions('auth:org-structure:read')
  async listManagers(
    @TenantId() tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const assignments = await this.managerService.listByEntity(
      tenantId,
      entityType as EntityType,
      entityId,
    );
    return {
      statusCode: 200,
      data: assignments.map((a) => ({
        id: a.id,
        entityType: a.entity_type,
        entityId: a.entity_id,
        userId: a.user_id,
        role: a.role,
        createdAt: a.created_at,
      })),
    };
  }

  @Post(':organizationId/:entityType/:entityId/managers')
  @RequirePermissions('auth:org-structure:write')
  async assignManager(
    @TenantId() tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body(new ZodValidationPipe(AssignManagerDto)) dto: AssignManagerDto,
  ) {
    const assignment = await this.managerService.assign({
      tenantId,
      entityType: entityType as EntityType,
      entityId,
      userId: dto.userId,
      role: dto.role as ManagerRole,
    });
    return {
      statusCode: 201,
      data: {
        id: assignment.id,
        entityType: assignment.entity_type,
        entityId: assignment.entity_id,
        userId: assignment.user_id,
        role: assignment.role,
        createdAt: assignment.created_at,
      },
    };
  }

  @Delete(':organizationId/:entityType/:entityId/managers/:assignmentId')
  @RequirePermissions('auth:org-structure:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignManager(
    @TenantId() tenantId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    await this.managerService.unassign(tenantId, assignmentId);
  }

  // ─── Manager Settings ─────────────────────────────────────

  @Get(':organizationId/manager-settings/:userId')
  @RequirePermissions('auth:org-structure:read')
  async getManagerSettings(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    const settings = await this.managerService.getSettings(
      tenantId,
      userId,
      entityType || 'global',
      entityId || null,
    );
    if (!settings) {
      return { statusCode: 200, data: this.defaultSettings(userId) };
    }
    return { statusCode: 200, data: this.mapSettings(settings) };
  }

  @Put(':organizationId/manager-settings/:userId')
  @RequirePermissions('auth:org-structure:write')
  async updateManagerSettings(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateManagerSettingsDto)) dto: UpdateManagerSettingsDto,
  ) {
    const { entityType, entityId, ...rest } = dto;
    // Map camelCase DTO → snake_case entity
    const mapped: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      notifyMemberJoin: 'notify_member_join',
      notifyMemberLeave: 'notify_member_leave',
      notifyTaskAssigned: 'notify_task_assigned',
      notifyApprovalRequest: 'notify_approval_request',
      notifyEscalation: 'notify_escalation',
      notifyReportReady: 'notify_report_ready',
      autoApproveLeave: 'auto_approve_leave',
      autoApproveExpense: 'auto_approve_expense',
      delegateToUserId: 'delegate_to_user_id',
      delegationActive: 'delegation_active',
      visibleInDirectory: 'visible_in_directory',
      receiveWeeklySummary: 'receive_weekly_summary',
    };
    for (const [camel, snake] of Object.entries(fieldMap)) {
      if ((rest as any)[camel] !== undefined) mapped[snake] = (rest as any)[camel];
    }
    const settings = await this.managerService.upsertSettings(
      tenantId,
      userId,
      entityType || 'global',
      entityId || null,
      mapped as any,
    );
    return { statusCode: 200, data: this.mapSettings(settings) };
  }

  // ─── Response Mappers ──────────────────────────────────────

  private defaultSettings(userId: string) {
    return {
      userId,
      entityType: 'global',
      entityId: null,
      notifyMemberJoin: true,
      notifyMemberLeave: true,
      notifyTaskAssigned: true,
      notifyApprovalRequest: true,
      notifyEscalation: true,
      notifyReportReady: true,
      autoApproveLeave: false,
      autoApproveExpense: false,
      delegateToUserId: null,
      delegationActive: false,
      visibleInDirectory: true,
      receiveWeeklySummary: true,
    };
  }

  private mapSettings(s: any) {
    return {
      id: s.id,
      userId: s.user_id,
      entityType: s.entity_type,
      entityId: s.entity_id,
      notifyMemberJoin: s.notify_member_join,
      notifyMemberLeave: s.notify_member_leave,
      notifyTaskAssigned: s.notify_task_assigned,
      notifyApprovalRequest: s.notify_approval_request,
      notifyEscalation: s.notify_escalation,
      notifyReportReady: s.notify_report_ready,
      autoApproveLeave: s.auto_approve_leave,
      autoApproveExpense: s.auto_approve_expense,
      delegateToUserId: s.delegate_to_user_id,
      delegationActive: s.delegation_active,
      visibleInDirectory: s.visible_in_directory,
      receiveWeeklySummary: s.receive_weekly_summary,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  }

  private mapDivision(d: any) {
    return {
      id: d.id,
      organizationId: d.organizationId,
      name: d.name,
      code: d.code,
      description: d.description,
      headUserId: d.headUserId,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private mapDepartment(d: any) {
    return {
      id: d.id,
      organizationId: d.organizationId,
      divisionId: d.divisionId,
      name: d.name,
      code: d.code,
      description: d.description,
      headUserId: d.headUserId,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private mapTeam(t: any) {
    return {
      id: t.id,
      organizationId: t.organizationId,
      departmentId: t.departmentId,
      name: t.name,
      code: t.code,
      description: t.description,
      leadUserId: t.leadUserId,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
