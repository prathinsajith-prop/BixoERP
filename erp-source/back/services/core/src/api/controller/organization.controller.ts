import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guard/permissions.guard';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import { TenantId, UserTenantId, CurrentUser } from '../decorator/auth.decorators';
import { OrganizationUseCase } from '../../application/use-case/organization.use-case';
import { AuditLogService } from '../../infrastructure/audit/audit-log.service';
import { OrgMemberRole } from '../../domain/entity/user-organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
  UpdateMemberRoleDto,
  SwitchOrganizationDto,
  UpdateBrandingDto,
} from '../dto/organization.dto';

@Controller('api/v1/auth/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly orgUseCase: OrganizationUseCase,
    private readonly auditLog: AuditLogService,
  ) { }

  // ─── Superuser: Create Organization ───────────────────────────

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:write')
  async create(
    @Body(new ZodValidationPipe(CreateOrganizationDto)) dto: CreateOrganizationDto,
    @CurrentUser() user: { sub: string },
  ) {
    const org = await this.orgUseCase.createOrganization({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      ownerId: user.sub,
    });
    return {
      statusCode: 201,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        status: org.status,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
      },
    };
  }

  // ─── User: My Organizations (placed BEFORE :id routes) ─────────

  @Get('me/list')
  async myOrganizations(@CurrentUser() user: { sub: string }) {
    const orgs = await this.orgUseCase.listUserOrganizations(user.sub);
    return { statusCode: 200, data: orgs };
  }

  // ─── User: Switch Organization ────────────────────────────────

  @Post('switch')
  @HttpCode(HttpStatus.OK)
  async switchOrganization(
    @Body(new ZodValidationPipe(SwitchOrganizationDto)) dto: SwitchOrganizationDto,
    @TenantId() tenantId: string,
    @UserTenantId() userTenantId: string,
    @CurrentUser() user: { sub: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.orgUseCase.switchOrganization({
      userId: user.sub,
      currentTenantId: tenantId,
      userTenantId,
      targetOrganizationId: dto.organizationId,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Re-issue the HttpOnly cookie with the new org's refresh token
    res.cookie('__erp_rt', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      statusCode: 200,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tenantId: result.tenantId,
      },
    };
  }

  // ─── Superuser: List Organizations ────────────────────────────

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:read')
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') search?: string,
    @Query('filter') filter?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_dir') sortDir?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const result = await this.orgUseCase.listOrganizations(p, l, {
      search: search?.trim() || undefined,
      filter: filter?.trim() || undefined,
      sortBy,
      sortDir: sortDir?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
    return {
      statusCode: 200,
      data: {
        organizations: result.organizations.map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          description: o.description,
          status: o.status,
          ownerId: o.ownerId,
          createdAt: o.createdAt,
          logoUrl: o.logoUrl || undefined,
        })),
        total: result.total,
        summary: result.summary,
      },
    };
  }

  // ─── Superuser: Get Organization ──────────────────────────────

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:read')
  async getOne(@Param('id') id: string) {
    const org = await this.orgUseCase.getOrganization(id);
    return {
      statusCode: 200,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        status: org.status,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        logoUrl: org.logoUrl,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
        accentColor: org.accentColor,
      },
    };
  }

  // ─── Superuser: Update Organization ───────────────────────────

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrganizationDto)) dto: UpdateOrganizationDto,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    const prev = await this.orgUseCase.getOrganization(id);
    const changeset: Array<{ field: string; previous: unknown; current: unknown }> = [];
    if (dto.name !== undefined && dto.name !== prev.name) changeset.push({ field: 'name', previous: prev.name, current: dto.name });
    if (dto.slug !== undefined && dto.slug !== prev.slug) changeset.push({ field: 'slug', previous: prev.slug, current: dto.slug });
    if (dto.description !== undefined && dto.description !== prev.description) changeset.push({ field: 'description', previous: prev.description, current: dto.description });

    await this.orgUseCase.updateOrganization(id, dto.name, dto.description, dto.slug);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'update_organization',
      description: changeset.length ? `Updated organization: ${changeset.map(c => c.field).join(', ')}` : 'Updated organization',
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
      metadata: { changes: changeset },
    }).catch(() => { });
  }

  // ─── Branding: Get ────────────────────────────────────────────

  @Get(':id/branding')
  async getBranding(@Param('id') id: string) {
    const branding = await this.orgUseCase.getBranding(id);
    return { statusCode: 200, data: branding };
  }

  // ─── Branding: Update ─────────────────────────────────────────

  @Put(':id/branding')
  @HttpCode(HttpStatus.OK)
  async updateBranding(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBrandingDto)) dto: UpdateBrandingDto,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    const prev = await this.orgUseCase.getBranding(id);
    const changeset: Array<{ field: string; previous: unknown; current: unknown }> = [];
    for (const key of Object.keys(dto)) {
      const prevVal = (prev as any)?.[key] ?? null;
      const nextVal = (dto as any)[key];
      if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
        changeset.push({ field: key, previous: prevVal, current: nextVal });
      }
    }

    await this.orgUseCase.updateBranding(id, dto);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'update_branding',
      description: changeset.length ? `Updated branding: ${changeset.map(c => c.field).join(', ')}` : 'Updated organization branding',
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
      metadata: { changes: changeset },
    }).catch(() => { });
    return { statusCode: 200, message: 'Branding updated' };
  }

  // ─── Settings: Get ────────────────────────────────────────────

  @Get(':id/settings')
  async getSettings(@Param('id') id: string) {
    const settings = await this.orgUseCase.getSettings(id);
    return { statusCode: 200, data: settings };
  }

  // ─── Settings: Update ─────────────────────────────────────────

  @Put(':id/settings')
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    const prev = await this.orgUseCase.getSettings(id);
    const changeset: Array<{ field: string; previous: unknown; current: unknown }> = [];
    for (const key of Object.keys(body)) {
      const prevVal = prev?.[key] ?? null;
      if (JSON.stringify(prevVal) !== JSON.stringify(body[key])) {
        changeset.push({ field: key, previous: prevVal, current: body[key] });
      }
    }

    await this.orgUseCase.updateSettings(id, body);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'update_settings',
      description: changeset.length ? `Updated settings: ${changeset.map(c => c.field).join(', ')}` : 'Updated organization settings',
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
      metadata: { changes: changeset },
    }).catch(() => { });
    return { statusCode: 200, message: 'Settings updated' };
  }

  // ─── Audit Log ────────────────────────────────────────────────

  @Get(':id/audit-log')
  async getAuditLog(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const { entries, total } = await this.auditLog.findByTenant(id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 200),
    });
    return {
      statusCode: 200,
      data: {
        entries: entries.map((e) => ({
          id: e.id,
          userId: e.user_id,
          userName: e.user_name,
          action: e.action,
          description: e.description,
          entityType: e.entity_type,
          entityId: e.entity_id,
          ipAddress: e.ip_address,
          metadata: e.metadata,
          createdAt: e.created_at,
        })),
        total,
      },
    };
  }

  // ─── Superuser: Add Member ────────────────────────────────────

  @Post(':id/members')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMember(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddMemberDto)) dto: AddMemberDto,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    await this.orgUseCase.addMember(id, dto.userId, dto.role as OrgMemberRole);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'add_member',
      description: `Added member ${dto.userId} with role ${dto.role}`,
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
    }).catch(() => { });
  }

  // ─── Superuser: Remove Member ─────────────────────────────────

  @Delete(':id/members/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    await this.orgUseCase.removeMember(id, userId);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'remove_member',
      description: `Removed member ${userId}`,
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
    }).catch(() => { });
  }

  // ─── Superuser: List Members ──────────────────────────────────

  @Get(':id/members')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:read')
  async listMembers(@Param('id') id: string) {
    const members = await this.orgUseCase.listMembers(id);
    return {
      statusCode: 200,
      data: members.map((m) => ({
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role,
        joinedAt: m.joinedAt,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        employeeId: m.employeeId ?? null,
      })),
    };
  }

  // ─── Superuser: Update Member Role ────────────────────────

  @Put(':id/members/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('auth:organizations:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateMemberRoleDto)) dto: UpdateMemberRoleDto,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    await this.orgUseCase.updateMemberRole(id, userId, dto.role as OrgMemberRole);
    this.auditLog.record({
      tenantId: id,
      userId: user.sub,
      userName: user.email ?? '',
      action: 'update_member_role',
      description: `Updated role of member ${userId} to ${dto.role}`,
      entityType: 'organization',
      entityId: id,
      ipAddress: req.ip ?? '',
      metadata: { targetUserId: userId, role: dto.role },
    }).catch(() => { });
  }
}
