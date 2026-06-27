import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';
import { FastifyRequest } from 'fastify';

interface AuthUser { id: string }

@ApiTags('Workspaces')
@UseGuards(SessionGuard)
@Controller('v1/workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List caller workspaces' })
  findAll(@Req() req: FastifyRequest & { user: AuthUser }) {
    return this.workspacesService.findAllForUser(req.user.id);
  }

  @Get(':workspaceId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace details' })
  findOne(@Param('workspaceId') id: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.workspacesService.findOne(id, req.user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.WORKSPACE, Action.EDIT)
  @ApiOperation({ summary: 'Update workspace' })
  update(@Param('workspaceId') id: string, @Body() body: { name?: string; billingEmail?: string; address?: string; legalName?: string }) {
    return this.workspacesService.update(id, body);
  }

  @Delete(':workspaceId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.WORKSPACE, Action.DELETE)
  @ApiOperation({ summary: 'Soft delete workspace' })
  remove(@Param('workspaceId') id: string, @Req() req: FastifyRequest & { user: AuthUser }) {
    return this.workspacesService.softDelete(id, req.user.id);
  }
}
