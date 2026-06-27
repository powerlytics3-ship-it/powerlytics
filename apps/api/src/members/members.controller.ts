import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Members')
@UseGuards(SessionGuard, PermissionGuard)
@Controller('v1/workspaces/:workspaceId/members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @RequirePermission(Resource.MEMBERS, Action.VIEW)
  @ApiOperation({ summary: 'List workspace members' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.membersService.findAll(workspaceId, +page, +limit);
  }

  @Post('invite')
  @RequirePermission(Resource.MEMBERS, Action.INVITE)
  @ApiOperation({ summary: 'Invite member' })
  invite(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string; role: string },
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.membersService.invite(workspaceId, req.user.id, body.email, body.role);
  }

  @Patch(':userId')
  @RequirePermission(Resource.MEMBERS, Action.EDIT_ROLE)
  @ApiOperation({ summary: 'Change member role' })
  changeRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.membersService.changeRole(workspaceId, userId, body.role, req.user.id);
  }

  @Delete(':userId')
  @RequirePermission(Resource.MEMBERS, Action.REMOVE)
  @ApiOperation({ summary: 'Remove member' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.membersService.remove(workspaceId, userId, req.user.id);
  }
}
