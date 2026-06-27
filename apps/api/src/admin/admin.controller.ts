import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionGuard } from '../auth/session.guard';
import { PlatformGuard } from '../auth/platform.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('Admin')
@UseGuards(SessionGuard, PlatformGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('workspaces')
  @ApiOperation({ summary: 'List all workspaces (superadmin)' })
  async listWorkspaces(@Query('page') page = '1', @Query('limit') limit = '50') {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where: { deletedAt: null },
        include: {
          _count: { select: { memberships: true, devices: true } },
        },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workspace.count({ where: { deletedAt: null } }),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  @Get('workspaces/:id')
  @ApiOperation({ summary: 'Get workspace detail (superadmin)' })
  getWorkspace(@Param('id') id: string) {
    return this.prisma.workspace.findUniqueOrThrow({
      where: { id },
      include: {
        memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
        devices: { include: { deviceModel: true } },
      },
    });
  }

  @Get('devices/unclaimed')
  @ApiOperation({ summary: 'List unclaimed devices (manufacturer/superadmin)' })
  async unclaimedDevices(@Query('page') page = '1', @Query('limit') limit = '50') {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where: { workspaceId: null, deletedAt: null },
        include: { deviceModel: true },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where: { workspaceId: null, deletedAt: null } }),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all platform users (superadmin)' })
  async listUsers(@Query('page') page = '1', @Query('limit') limit = '50') {
    const skip = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, name: true, email: true, platformRole: true, createdAt: true, emailVerified: true },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page: +page, limit: +limit };
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Platform-wide audit log (superadmin)' })
  platformAuditLog(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.audit.findAll(+page, +limit);
  }
}
