import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { CurrentUser } from '../decorator/auth.decorators';
import { InvitationUseCase } from '../../application/use-case/invitation.use-case';

@Controller('api/v1/auth/invitations')
export class InvitationController {
    constructor(private readonly invitationUseCase: InvitationUseCase) { }

    /** Preview an invite without authentication (linked from email) */
    @Get('preview')
    async preview(@Query('token') token: string) {
        const data = await this.invitationUseCase.getInvitePreview(token);
        return { statusCode: 200, data };
    }

    /** Accept an invite (no auth required — new users may not have a JWT yet) */
    @Post('accept')
    @HttpCode(HttpStatus.OK)
    async accept(@Body() body: { token: string; userId?: string }) {
        await this.invitationUseCase.acceptInvite({
            token: body.token,
            userId: body.userId,
        });
        return { statusCode: 200, message: 'Invitation accepted' };
    }

    /** Send an invite to an email — requires ADMIN or OWNER role */
    @Post()
    @UseGuards(JwtAuthGuard)
    async invite(
        @Body() body: { organisationId: string; email: string; roleName?: string; message?: string },
        @CurrentUser() user: { sub: string },
    ) {
        const result = await this.invitationUseCase.invite({
            invitedByUserId: user.sub,
            organisationId: body.organisationId,
            email: body.email,
            roleName: body.roleName,
            message: body.message,
        });
        return { statusCode: 201, data: result };
    }

    /** List pending invitations for an org */
    @Get(':orgId/pending')
    @UseGuards(JwtAuthGuard)
    async listPending(
        @Param('orgId') orgId: string,
        @CurrentUser() user: { sub: string },
    ) {
        const data = await this.invitationUseCase.listPending(orgId, user.sub);
        return { statusCode: 200, data };
    }

    /** Revoke a pending invitation */
    @Delete(':inviteId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async revoke(
        @Param('inviteId') inviteId: string,
        @Body() body: { organisationId: string },
        @CurrentUser() user: { sub: string },
    ) {
        await this.invitationUseCase.revokeInvite(inviteId, user.sub, body.organisationId);
    }
}
