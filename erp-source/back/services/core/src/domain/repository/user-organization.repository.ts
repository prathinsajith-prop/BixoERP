import { UserOrganization } from '../entity/user-organization.entity';

export const USER_ORGANIZATION_REPOSITORY = Symbol('USER_ORGANIZATION_REPOSITORY');

export interface UserOrganizationRepository {
  findByUserId(userId: string): Promise<UserOrganization[]>;
  findByOrgId(organizationId: string): Promise<UserOrganization[]>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<UserOrganization | null>;
  save(uo: UserOrganization): Promise<void>;
  delete(userId: string, organizationId: string): Promise<void>;
}
