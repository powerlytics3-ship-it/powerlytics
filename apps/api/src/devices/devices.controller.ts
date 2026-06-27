import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Devices')
@UseGuards(SessionGuard, PermissionGuard)
@Controller('v1')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('devices/manufacture')
  @RequirePermission(Resource.DEVICES, Action.MANUFACTURE)
  @ApiOperation({ summary: 'Manufacture new device (unclaimed)' })
  manufacture(@Body() body: { imei: string; serialNumber: string; deviceModelId: string; name?: string }, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.manufacture(body, req.user.id);
  }

  @Get('workspaces/:workspaceId/devices')
  @RequirePermission(Resource.DEVICES, Action.VIEW)
  @ApiOperation({ summary: 'List workspace devices' })
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.devicesService.findAll(workspaceId);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId')
  @RequirePermission(Resource.DEVICES, Action.VIEW)
  @ApiOperation({ summary: 'Get device detail' })
  findOne(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId, workspaceId);
  }

  @Post('workspaces/:workspaceId/devices/claim')
  @RequirePermission(Resource.DEVICES, Action.CLAIM)
  @ApiOperation({ summary: 'Claim device by claim code' })
  claim(@Param('workspaceId') workspaceId: string, @Body() body: { claimCode: string }, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.claim(body.claimCode, workspaceId, req.user.id);
  }

  @Patch('workspaces/:workspaceId/devices/:deviceId')
  @RequirePermission(Resource.DEVICES, Action.EDIT_CONFIG)
  @ApiOperation({ summary: 'Update device metadata' })
  update(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Body() body: any, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.update(deviceId, body, req.user.id, workspaceId);
  }

  @Patch('workspaces/:workspaceId/devices/:deviceId/ports/:portKey')
  @RequirePermission(Resource.DEVICES, Action.EDIT_CONFIG)
  @ApiOperation({ summary: 'Update device port configuration' })
  updatePort(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Param('portKey') portKey: string, @Body() body: any, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.updatePort(deviceId, portKey, body, req.user.id, workspaceId);
  }

  @Post('workspaces/:workspaceId/devices/:deviceId/credential')
  @RequirePermission(Resource.DEVICES, Action.EDIT_CONFIG)
  @ApiOperation({ summary: 'Issue device API key (shown once)' })
  issueCredential(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.issueCredential(deviceId, req.user.id, workspaceId);
  }

  @Post('workspaces/:workspaceId/devices/:deviceId/credential/revoke')
  @RequirePermission(Resource.DEVICES, Action.EDIT_CONFIG)
  @ApiOperation({ summary: 'Revoke device API key' })
  revokeCredential(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.revokeCredential(deviceId, req.user.id, workspaceId);
  }

  @Post('workspaces/:workspaceId/devices/:deviceId/transfer')
  @RequirePermission(Resource.DEVICES, Action.TRANSFER_OUT)
  @ApiOperation({ summary: 'Initiate device transfer' })
  initiateTransfer(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Body() body: { toWorkspaceId: string; reason: string }, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.initiateTransfer(deviceId, body.toWorkspaceId, body.reason, req.user.id, workspaceId);
  }

  @Delete('workspaces/:workspaceId/devices/:deviceId')
  @RequirePermission(Resource.DEVICES, Action.EDIT_CONFIG)
  @ApiOperation({ summary: 'Decommission device' })
  remove(@Param('workspaceId') workspaceId: string, @Param('deviceId') deviceId: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.devicesService.softDelete(deviceId, req.user.id, workspaceId);
  }
}
