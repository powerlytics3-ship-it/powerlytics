import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.workspaceMembership.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map((m) => ({ ...m.workspace, role: m.role }));
  }

  async findOne(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    return { ...membership.workspace, role: membership.role };
  }

  async update(workspaceId: string, dto: { name?: string; billingEmail?: string; address?: string; legalName?: string }) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async softDelete(workspaceId: string, userId: string) {
    const ws = await this.prisma.workspace.findFirst({
      where: { id: workspaceId },
      include: { memberships: { where: { userId, role: 'OWNER' } } },
    });
    if (!ws || ws.memberships.length === 0) throw new ForbiddenException('Only OWNER can delete workspace');
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
