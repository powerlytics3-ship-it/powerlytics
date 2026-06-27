import { Controller, Post, Get, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActuationService } from './actuation.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Public } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Actuation')
@Controller('v1')
export class ActuationController {
  constructor(private service: ActuationService) {}

  @Post('workspaces/:workspaceId/devices/:deviceId/actuations')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.ACTUATION, Action.SEND_COMMAND)
  @ApiOperation({ summary: 'Send actuation command' })
  sendCommand(
    @Param('workspaceId') workspaceId: string,
    @Param('deviceId') deviceId: string,
    @Body() body: { portKey: string; action: string; requestedValue: unknown; idempotencyKey: string },
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.service.sendCommand(deviceId, workspaceId, body, req.user.id);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/actuations')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.ACTUATION, Action.VIEW_HISTORY)
  @ApiOperation({ summary: 'Actuation history' })
  history(
    @Param('workspaceId') workspaceId: string,
    @Param('deviceId') deviceId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.service.findHistory(deviceId, workspaceId, +page, +limit);
  }

  @Post('internal/bridge/actuations/:id/ack')
  @Public()
  @ApiOperation({ summary: 'Bridge actuation ack' })
  bridgeAck(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.handleBridgeAck(id, body.status);
  }
}
