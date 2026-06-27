import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SessionGuard } from '../auth/session.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Resource, Action } from '@powerlytic/permissions';

@ApiTags('Audit Log')
@UseGuards(SessionGuard, PermissionGuard)
@Controller('v1')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('workspaces/:workspaceId/audit-log')
  @RequirePermission(Resource.AUDIT_LOG, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace audit log' })
  getWorkspaceAuditLog(
    @Param('workspaceId') workspaceId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.auditService.findByWorkspace(workspaceId, +page, +limit);
  }
}
