import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortTypesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.portType.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.portType.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException('Port type not found'); });
  }

  create(dto: { name: string; category: string; valueFormat: string; codeName: string; description?: string }) {
    return this.prisma.portType.create({ data: dto as any });
  }

  update(id: string, dto: Partial<{ name: string; category: string; valueFormat: string; codeName: string; description: string }>) {
    return this.prisma.portType.update({ where: { id }, data: dto as any });
  }

  delete(id: string) {
    return this.prisma.portType.delete({ where: { id } });
  }
}
