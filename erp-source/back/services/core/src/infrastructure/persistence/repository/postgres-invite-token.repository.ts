import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteTokenOrmEntity } from '../entity/invite-token.orm-entity';

@Injectable()
export class PostgresInviteTokenRepository {
    constructor(
        @InjectRepository(InviteTokenOrmEntity)
        private readonly repo: Repository<InviteTokenOrmEntity>,
    ) { }

    async findByToken(token: string): Promise<InviteTokenOrmEntity | null> {
        return this.repo.findOne({ where: { token } });
    }

    async findPendingByOrg(organisationId: string): Promise<InviteTokenOrmEntity[]> {
        return this.repo.find({ where: { organisation_id: organisationId, status: 'PENDING' } });
    }

    async save(invite: Partial<InviteTokenOrmEntity>): Promise<InviteTokenOrmEntity> {
        return this.repo.save(this.repo.create(invite));
    }

    async updateStatus(
        id: string,
        status: string,
        extra?: Partial<InviteTokenOrmEntity>,
    ): Promise<void> {
        await this.repo.update(id, { status, ...extra });
    }
}
