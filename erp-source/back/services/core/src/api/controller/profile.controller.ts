import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TenantId, CurrentUser } from '../decorator/auth.decorators';
import { ZodValidationPipe } from '../pipe/zod-validation.pipe';
import { UpdateProfileDto } from '../dto/profile.dto';
import { PostgresUserProfileRepository } from '../../infrastructure/persistence/repository/postgres-user-profile.repository';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { AuditLogService } from '../../infrastructure/audit/audit-log.service';

@Controller('api/v1/auth/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileRepo: PostgresUserProfileRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  async getProfile(
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const [profile, userEntity] = await Promise.all([
      this.profileRepo.findByUserId(tenantId, user.sub),
      this.userRepo.findById(tenantId, user.sub),
    ]);
    return {
      statusCode: 200,
      data: {
        ...profile,
        user: userEntity
          ? {
              id: userEntity.id,
              email: userEntity.email.value,
              firstName: userEntity.firstName,
              lastName: userEntity.lastName,
              status: userEntity.status,
              roles: userEntity.roles,
              lastLoginAt: userEntity.lastLoginAt,
              createdAt: userEntity.createdAt,
            }
          : null,
      },
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body(new ZodValidationPipe(UpdateProfileDto)) dto: UpdateProfileDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { sub: string; email?: string },
    @Req() req: Request,
  ) {
    // Capture previous values
    const [prevProfile, prevUser] = await Promise.all([
      this.profileRepo.findByUserId(tenantId, user.sub),
      this.userRepo.findById(tenantId, user.sub),
    ]);

    const changeset: Array<{ field: string; previous: unknown; current: unknown }> = [];

    // Update firstName / lastName on the User entity if provided
    let userName = user.email ?? '';
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      if (prevUser) {
        if (dto.firstName !== undefined && dto.firstName !== prevUser.firstName) {
          changeset.push({ field: 'firstName', previous: prevUser.firstName, current: dto.firstName });
          prevUser.firstName = dto.firstName;
        }
        if (dto.lastName !== undefined && dto.lastName !== prevUser.lastName) {
          changeset.push({ field: 'lastName', previous: prevUser.lastName, current: dto.lastName });
          prevUser.lastName = dto.lastName;
        }
        await this.userRepo.update(prevUser);
        userName = [prevUser.firstName, prevUser.lastName].filter(Boolean).join(' ') || userName;
      }
    }

    // Strip name fields before storing in the profile JSONB
    const { firstName, lastName, ...profileData } = dto;

    // Track profile field changes
    const prevData = (prevProfile as unknown as Record<string, unknown>) ?? {};
    for (const key of Object.keys(profileData)) {
      const prev = (prevData as any)[key];
      const next = (profileData as any)[key];
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        changeset.push({ field: key, previous: prev ?? null, current: next });
      }
    }

    const profile = await this.profileRepo.upsert(tenantId, user.sub, profileData as Record<string, unknown>);

    // Audit log
    const changedFields = changeset.map((c) => c.field);
    const desc = changedFields.length
      ? `Updated profile: ${changedFields.join(', ')}`
      : 'Updated profile';

    this.auditLog.record({
      tenantId,
      userId: user.sub,
      userName,
      action: 'update_profile',
      description: desc,
      entityType: 'user',
      entityId: user.sub,
      ipAddress: req.ip ?? '',
      metadata: { changes: changeset },
    }).catch(() => {}); // fire-and-forget

    return { statusCode: 200, data: profile };
  }
}
