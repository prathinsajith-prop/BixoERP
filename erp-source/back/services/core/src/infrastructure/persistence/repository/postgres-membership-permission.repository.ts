import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPermissionOrmEntity } from '../entity/membership-permission.orm-entity';

@Injectable()
export class PostgresMembershipPermissionRepository {
    constructor(
        @InjectRepository(MembershipPermissionOrmEntity)
        private readonly repo: Repository<MembershipPermissionOrmEntity>,
    ) { }

    async findByMembership(membershipId: string): Promise<MembershipPermissionOrmEntity[]> {
        return this.repo.find({ where: { membership_id: membershipId } });
    }

    async upsert(
        membershipId: string,
        permissionId: string,
        isGranted: boolean,
        grantedBy: string,
    ): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .insert()
            .into(MembershipPermissionOrmEntity)
            .values({ membership_id: membershipId, permission_id: permissionId, is_granted: isGranted, granted_by: grantedBy })
            .orUpdate(['is_granted', 'granted_by'], ['membership_id', 'permission_id'])
            .execute();
    }

    async delete(membershipId: string, permissionId: string): Promise<void> {
        await this.repo.delete({ membership_id: membershipId, permission_id: permissionId });
    }
}
