import { Controller, Post, Get, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelemetryIngestionService } from './telemetry-ingestion.service';
import { TelemetryQueryService } from './telemetry-query.service';
import { DeviceAuthGuard } from '../auth/device-auth.guard';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

@ApiTags('Telemetry')
@Controller('v1')
export class TelemetryController {
  constructor(
    private ingestionService: TelemetryIngestionService,
    private queryService: TelemetryQueryService,
  ) {}

  @Post('device/telemetry')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Ingest telemetry from device (X-Device-Key auth)' })
  ingest(@Req() req: FastifyRequest & { device: { id: string; workspaceId: string } }, @Body() body: any) {
    return this.ingestionService.ingest(req.device, body);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/telemetry/latest')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.TELEMETRY, Action.VIEW)
  @ApiOperation({ summary: 'Latest telemetry per port' })
  latest(@Param('deviceId') deviceId: string, @Param('workspaceId') workspaceId: string) {
    return this.queryService.getLatest(deviceId, workspaceId);
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/telemetry/timeseries/:portKey')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.TELEMETRY, Action.VIEW)
  @ApiOperation({ summary: 'Time-series data for a port' })
  timeseries(
    @Param('deviceId') deviceId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('portKey') portKey: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.queryService.getTimeseries(deviceId, workspaceId, portKey, new Date(from), new Date(to));
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/telemetry/stats/:portKey')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.TELEMETRY, Action.VIEW)
  @ApiOperation({ summary: 'Telemetry stats for a port' })
  stats(
    @Param('deviceId') deviceId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('portKey') portKey: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.queryService.getStats(deviceId, workspaceId, portKey, new Date(from), new Date(to));
  }

  @Get('workspaces/:workspaceId/devices/:deviceId/telemetry/table')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermission(Resource.TELEMETRY, Action.VIEW)
  @ApiOperation({ summary: 'Telemetry table view (paginated)' })
  table(
    @Param('deviceId') deviceId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    return this.queryService.getTable(deviceId, workspaceId, new Date(from), new Date(to), +page, +limit);
  }
}
