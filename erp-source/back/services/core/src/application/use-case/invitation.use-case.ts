import {
    Inject,
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repository/user.repository';
import { USER_ORGANIZATION_REPOSITORY, UserOrganizationRepository } from '../../domain/repository/user-organization.repository';
import { ORGANIZATION_REPOSITORY, OrganizationRepository } from '../../domain/repository/organization.repository';
import { UserOrganization, OrgMemberRole } from '../../domain/entity/user-organization.entity';
import { PostgresInviteTokenRepository } from '../../infrastructure/persistence/repository/postgres-invite-token.repository';

export interface InviteCommand {
    invitedByUserId: string;
    organisationId: string;
    email: string;
    roleName?: string;
    message?: string;
}

export interface AcceptInviteCommand {
    token: string;
    /** For existing users — their user ID */
    userId?: string;
    /** For new users — registration details */
    firstName?: string;
    lastName?: string;
    password?: string;
}

@Injectable()
export class InvitationUseCase {
    private readonly INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

    constructor(
        @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(USER_ORGANIZATION_REPOSITORY) private readonly userOrgRepo: UserOrganizationRepository,
        @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
        private readonly inviteTokenRepo: PostgresInviteTokenRepository,
    ) { }

    async invite(cmd: InviteCommand): Promise<{ inviteUrl: string; token: string }> {
        const org = await this.orgRepo.findById(cmd.organisationId);
        if (!org) throw new NotFoundException('Organisation not found');

        // Check inviter is an ADMIN or OWNER in this org
        const inviterMembership = await this.userOrgRepo.findByUserAndOrg(
            cmd.invitedByUserId,
            cmd.organisationId,
        );
        if (
            !inviterMembership ||
            !inviterMembership.isActive() ||
            ![OrgMemberRole.OWNER, OrgMemberRole.ADMIN].includes(inviterMembership.role)
        ) {
            throw new ForbiddenException('Only admins and owners can invite members');
        }

        // Check if there is already an active pending invite for this email
        const existing = await this.inviteTokenRepo.findPendingByOrg(cmd.organisationId);
        const duplicate = existing.find((i) => i.invited_email === cmd.email);
        if (duplicate) {
            throw new BadRequestException(
                `An invitation is already pending for ${cmd.email} in this organisation`,
            );
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.INVITE_TTL_MS);

        await this.inviteTokenRepo.save({
            token,
            organisation_id: cmd.organisationId,
            invited_email: cmd.email,
            role_name: cmd.roleName ?? null,
            invited_by: cmd.invitedByUserId,
            status: 'PENDING',
            message: cmd.message ?? null,
            expires_at: expiresAt,
        });

        const inviteUrl = `/accept-invite?token=${token}`;
        return { inviteUrl, token };
    }

    async acceptInvite(cmd: AcceptInviteCommand): Promise<void> {
        const invite = await this.inviteTokenRepo.findByToken(cmd.token);
        if (!invite) throw new NotFoundException('Invitation not found');
        if (invite.status !== 'PENDING') {
            throw new BadRequestException(`Invitation is ${invite.status.toLowerCase()}`);
        }
        if (new Date() > invite.expires_at) {
            await this.inviteTokenRepo.updateStatus(invite.id, 'EXPIRED');
            throw new BadRequestException('Invitation has expired');
        }

        // Look up or validate the accepting user
        let userId: string | undefined = cmd.userId;
        if (!userId) {
            // New user flow — look up by email
            const existingUser = await this.userRepo.findByEmailGlobal(invite.invited_email);
            userId = existingUser?.id;
        }

        if (!userId) {
            throw new BadRequestException(
                'User not found. Please register first then accept the invitation.',
            );
        }

        // Check if already a member
        const existing = await this.userOrgRepo.findByUserAndOrg(userId, invite.organisation_id);
        if (existing && existing.isActive()) {
            throw new BadRequestException('User is already a member of this organisation');
        }

        // Create membership
        const membership = UserOrganization.create(
            userId,
            invite.organisation_id,
            (invite.role_name as OrgMemberRole) ?? OrgMemberRole.MEMBER,
        );
        await this.userOrgRepo.save(membership);

        // Mark invite as accepted
        await this.inviteTokenRepo.updateStatus(invite.id, 'ACCEPTED', {
            accepted_at: new Date(),
            accepted_by: userId,
        } as any);
    }

    async revokeInvite(inviteId: string, revokedByUserId: string, organisationId: string): Promise<void> {
        const invites = await this.inviteTokenRepo.findPendingByOrg(organisationId);
        const invite = invites.find((i) => i.id === inviteId);
        if (!invite) throw new NotFoundException('Pending invitation not found');

        // Only admin/owner can revoke
        const membership = await this.userOrgRepo.findByUserAndOrg(revokedByUserId, organisationId);
        if (
            !membership ||
            !membership.isActive() ||
            ![OrgMemberRole.OWNER, OrgMemberRole.ADMIN].includes(membership.role)
        ) {
            throw new ForbiddenException('Only admins and owners can revoke invitations');
        }

        await this.inviteTokenRepo.updateStatus(invite.id, 'REVOKED');
    }

    async listPending(organisationId: string, requestingUserId: string) {
        const membership = await this.userOrgRepo.findByUserAndOrg(requestingUserId, organisationId);
        if (!membership || !membership.isActive()) {
            throw new ForbiddenException('Not a member of this organisation');
        }

        const invites = await this.inviteTokenRepo.findPendingByOrg(organisationId);
        return invites.map((i) => ({
            id: i.id,
            email: i.invited_email,
            roleName: i.role_name,
            status: i.status,
            expiresAt: i.expires_at,
            createdAt: i.created_at,
        }));
    }

    async getInvitePreview(token: string) {
        const invite = await this.inviteTokenRepo.findByToken(token);
        if (!invite) throw new NotFoundException('Invitation not found');
        if (invite.status !== 'PENDING') {
            throw new BadRequestException(`Invitation is ${invite.status.toLowerCase()}`);
        }
        if (new Date() > invite.expires_at) {
            throw new BadRequestException('Invitation has expired');
        }
        const org = await this.orgRepo.findById(invite.organisation_id);
        return {
            email: invite.invited_email,
            orgName: org?.name ?? '',
            orgSlug: org?.slug ?? '',
            roleName: invite.role_name,
            message: invite.message,
            expiresAt: invite.expires_at,
        };
    }
}
