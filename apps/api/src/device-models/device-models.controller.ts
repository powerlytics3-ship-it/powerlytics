import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeviceModelsService } from './device-models.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Device Models')
@UseGuards(SessionGuard)
@Controller('v1/device-models')
export class DeviceModelsController {
  constructor(private service: DeviceModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List device models' })
  findAll(@Query('status') status?: string) { return this.service.findAll(status); }

  @Get(':id')
  @ApiOperation({ summary: 'Get device model' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.DEVICE_MODELS, Action.CREATE)
  @ApiOperation({ summary: 'Create device model draft' })
  create(@Body() body: { name: string; description?: string; microControllerType?: string; ports: any[] }) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.DEVICE_MODELS, Action.EDIT)
  @ApiOperation({ summary: 'Edit device model draft' })
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; description: string }>) {
    return this.service.update(id, body);
  }

  @Post(':id/publish')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.DEVICE_MODELS, Action.PUBLISH)
  @ApiOperation({ summary: 'Publish device model' })
  publish(@Param('id') id: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.service.publish(id, req.user.id);
  }

  @Post(':id/new-version')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.DEVICE_MODELS, Action.CREATE)
  @ApiOperation({ summary: 'Create new version of published model' })
  newVersion(@Param('id') id: string) {
    return this.service.createNewVersion(id);
  }
}
