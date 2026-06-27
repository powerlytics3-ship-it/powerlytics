import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Alerts')
@UseGuards(SessionGuard, PermissionGuard)
@Controller('v1/workspaces/:workspaceId')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get('alert-rules')
  @RequirePermission(Resource.ALERT_RULES, Action.VIEW)
  findRules(@Param('workspaceId') workspaceId: string) {
    return this.alertsService.findRules(workspaceId);
  }

  @Post('alert-rules')
  @RequirePermission(Resource.ALERT_RULES, Action.CREATE)
  createRule(@Param('workspaceId') workspaceId: string, @Body() body: any, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.alertsService.createRule(workspaceId, req.user.id, body);
  }

  @Patch('alert-rules/:ruleId')
  @RequirePermission(Resource.ALERT_RULES, Action.EDIT)
  updateRule(@Param('workspaceId') workspaceId: string, @Param('ruleId') id: string, @Body() body: any) {
    return this.alertsService.updateRule(id, workspaceId, body);
  }

  @Delete('alert-rules/:ruleId')
  @RequirePermission(Resource.ALERT_RULES, Action.DELETE)
  deleteRule(@Param('workspaceId') workspaceId: string, @Param('ruleId') id: string) {
    return this.alertsService.deleteRule(id, workspaceId);
  }

  @Get('alert-events')
  @RequirePermission(Resource.ALERT_EVENTS, Action.VIEW)
  findEvents(@Param('workspaceId') workspaceId: string, @Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '50') {
    return this.alertsService.findEvents(workspaceId, status, +page, +limit);
  }

  @Post('alert-events/:eventId/acknowledge')
  @RequirePermission(Resource.ALERT_EVENTS, Action.ACKNOWLEDGE)
  acknowledge(@Param('eventId') id: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.alertsService.acknowledgeEvent(id, req.user.id);
  }

  @Post('alert-events/:eventId/resolve')
  @RequirePermission(Resource.ALERT_EVENTS, Action.RESOLVE)
  resolve(@Param('eventId') id: string) {
    return this.alertsService.resolveEvent(id);
  }

  @Get('notification-channels')
  @RequirePermission(Resource.ALERT_RULES, Action.VIEW)
  findChannels(@Param('workspaceId') workspaceId: string) {
    return this.alertsService.findChannels(workspaceId);
  }

  @Post('notification-channels')
  @RequirePermission(Resource.ALERT_RULES, Action.EDIT)
  createChannel(@Param('workspaceId') workspaceId: string, @Body() body: { type: string; target: string }) {
    return this.alertsService.createChannel(workspaceId, body);
  }
}
