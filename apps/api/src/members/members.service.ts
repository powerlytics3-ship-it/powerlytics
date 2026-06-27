import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll(workspaceId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.workspaceMembership.findMany({
        where: { workspaceId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        skip,
        take: limit,
      }),
      this.prisma.workspaceMembership.count({ where: { workspaceId } }),
    ]);
    return { data, total, page, limit };
  }

  async invite(workspaceId: string, invitedById: string, email: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await this.prisma.invitation.create({
      data: { workspaceId, email, role: role as any, invitedById, expiresAt },
    });
    await this.audit.write({
      workspaceId,
      actorUserId: invitedById,
      action: 'member.invited',
      targetType: 'Invitation',
      targetId: invitation.id,
      afterValue: { email, role },
    });
    return invitation;
  }

  async changeRole(workspaceId: string, userId: string, newRole: string, actorId: string) {
    const membership = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER') throw new BadRequestException('Cannot change OWNER role');

    const updated = await this.prisma.workspaceMembership.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role: newRole as any },
    });

    await this.audit.write({
      workspaceId,
      actorUserId: actorId,
      action: 'member.role_changed',
      targetType: 'User',
      targetId: userId,
      beforeValue: { role: membership.role },
      afterValue: { role: newRole },
    });

    return updated;
  }

  async remove(workspaceId: string, userId: string, actorId: string) {
    const membership = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER') throw new BadRequestException('Cannot remove workspace OWNER');

    await this.prisma.workspaceMembership.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    await this.audit.write({
      workspaceId,
      actorUserId: actorId,
      action: 'member.removed',
      targetType: 'User',
      targetId: userId,
    });
  }
}
