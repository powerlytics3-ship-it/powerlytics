import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortTypesService } from './port-types.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';

@ApiTags('Port Types')
@UseGuards(SessionGuard)
@Controller('v1/port-types')
export class PortTypesController {
  constructor(private portTypesService: PortTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all port types' })
  findAll() { return this.portTypesService.findAll(); }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.PORT_TYPES, Action.CREATE)
  @ApiOperation({ summary: 'Create port type' })
  create(@Body() body: { name: string; category: string; valueFormat: string; codeName: string; description?: string }) {
    return this.portTypesService.create(body);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.PORT_TYPES, Action.EDIT)
  @ApiOperation({ summary: 'Update port type' })
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; description: string }>) {
    return this.portTypesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.PORT_TYPES, Action.EDIT)
  @ApiOperation({ summary: 'Delete port type' })
  delete(@Param('id') id: string) {
    return this.portTypesService.delete(id);
  }
}
