import { Controller, Post, Get, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigDeploymentService } from './config-deployment.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { Public } from '../common/decorators/require-permission.decorator';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Config Deployment')
@Controller('v1')
export class ConfigDeploymentController {
  constructor(private service: ConfigDeploymentService) {}

  @Post('workspaces/:workspaceId/devices/:deviceId/deployments')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.CONFIG_DEPLOYMENT, Action.DEPLOY)
  @ApiOperation({ summary: 'Deploy config to device' })
  deploy(
    @Param('workspaceId') workspaceId: string,
    @Param('deviceId') deviceId: string,
    @Req() req: FastifyRequest & { user: AuthUser },
  ) {
    return this.service.deploy(deviceId, req.user.id, workspaceId);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/deployments')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.CONFIG_DEPLOYMENT, Action.VIEW_HISTORY)
  @ApiOperation({ summary: 'Deployment history' })
  history(
    @Param('deviceId') deviceId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.findHistory(deviceId, workspaceId, +page, +limit);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/deployments/latest')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.CONFIG_DEPLOYMENT, Action.VIEW_HISTORY)
  @ApiOperation({ summary: 'Latest deployment' })
  latest(@Param('deviceId') deviceId: string) {
    return this.service.findLatest(deviceId);
  }

  @Post('internal/bridge/deployments/:id/ack')
  @Public()
  @ApiOperation({ summary: 'Bridge callback: deployment ack' })
  async bridgeAck(
    @Param('id') id: string,
    @Body() body: { status: string; message?: string },
    @Req() req: FastifyRequest,
  ) {
    const sig = req.headers['x-signature'] as string | undefined;
    const rawBody = JSON.stringify(body);
    return this.service.handleBridgeAck(id, body.status, body.message, sig, rawBody);
  }
}
