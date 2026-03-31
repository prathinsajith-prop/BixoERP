import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../domain/entity/role.entity';
import { Permission } from '../../domain/entity/permission.entity';
import { ROLE_REPOSITORY, RoleRepository } from '../../domain/repository/role.repository';
import { PERMISSION_REPOSITORY, PermissionRepository } from '../../domain/repository/permission.repository';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { EntityNotFoundException } from '../../domain/exception/domain.exceptions';

export interface CreateRoleCommand {
  tenantId: string;
  name: string;
  description: string;
  permissionIds: string[];
}

export interface AssignRoleCommand {
  tenantId: string;
  userId: string;
  roleId: string;
}

export interface RemoveRoleCommand {
  tenantId: string;
  userId: string;
  roleId: string;
}

export interface CreatePermissionCommand {
  tenantId: string;
  resource: string;
  action: string;
  description: string;
}

@Injectable()
export class ManageRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async createRole(cmd: CreateRoleCommand): Promise<{ roleId: string }> {
    const role = Role.create(cmd.tenantId, cmd.name, cmd.description);
    for (const pid of cmd.permissionIds) {
      role.addPermission(pid);
    }
    await this.roleRepo.save(role);
    return { roleId: role.id };
  }

  async updateRole(tenantId: string, roleId: string, name: string, description: string, permissionIds: string[]): Promise<void> {
    const role = await this.roleRepo.findById(tenantId, roleId);
    if (!role) throw new EntityNotFoundException('Role', roleId);
    role.update(name, description);
    role.permissions = [];
    for (const pid of permissionIds) {
      role.addPermission(pid);
    }
    await this.roleRepo.update(role);
  }

  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    const role = await this.roleRepo.findById(tenantId, roleId);
    if (!role) throw new EntityNotFoundException('Role', roleId);
    if (role.isSystem) throw new Error('Cannot delete system role');
    await this.roleRepo.delete(tenantId, roleId);
  }

  async listRoles(tenantId: string): Promise<Role[]> {
    return this.roleRepo.findByTenant(tenantId);
  }

  async assignRole(cmd: AssignRoleCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.tenantId, cmd.userId);
    if (!user) throw new EntityNotFoundException('User', cmd.userId);
    const role = await this.roleRepo.findById(cmd.tenantId, cmd.roleId);
    if (!role) throw new EntityNotFoundException('Role', cmd.roleId);
    user.assignRole(role.id);
    await this.userRepo.update(user);
  }

  async removeRole(cmd: RemoveRoleCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.tenantId, cmd.userId);
    if (!user) throw new EntityNotFoundException('User', cmd.userId);
    user.removeRole(cmd.roleId);
    await this.userRepo.update(user);
  }

  async createPermission(cmd: CreatePermissionCommand): Promise<{ permissionId: string }> {
    const perm = Permission.create(cmd.tenantId, cmd.resource, cmd.action, cmd.description);
    await this.permissionRepo.save(perm);
    return { permissionId: perm.id };
  }

  async listPermissions(tenantId: string): Promise<Permission[]> {
    return this.permissionRepo.findByTenant(tenantId);
  }

  async deletePermission(tenantId: string, permissionId: string): Promise<void> {
    await this.permissionRepo.delete(tenantId, permissionId);
  }
}
