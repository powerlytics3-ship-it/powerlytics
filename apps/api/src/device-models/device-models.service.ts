import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceModelsService {
  constructor(private prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.deviceModel.findMany({
      where: { deletedAt: null, ...(status ? { status: status as any } : {}) },
      include: { ports: { include: { portType: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.deviceModel.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { ports: { include: { portType: true }, orderBy: { sortOrder: 'asc' } } },
    }).catch(() => { throw new NotFoundException('Device model not found'); });
  }

  async create(dto: {
    name: string;
    description?: string;
    microControllerType?: string;
    ports: Array<{ portTypeId: string; portKey: string; microControllerPin?: string; description?: string; sortOrder?: number }>;
  }) {
    return this.prisma.deviceModel.create({
      data: {
        name: dto.name,
        description: dto.description,
        microControllerType: dto.microControllerType,
        status: 'DRAFT',
        ports: { create: dto.ports as any },
      },
      include: { ports: true },
    });
  }

  async update(id: string, dto: Partial<{ name: string; description: string; microControllerType: string }>) {
    const model = await this.prisma.deviceModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Device model not found');
    if (model.status === 'PUBLISHED') throw new BadRequestException('Cannot edit a PUBLISHED model');
    return this.prisma.deviceModel.update({ where: { id }, data: dto });
  }

  async publish(id: string, publishedById: string) {
    const model = await this.prisma.deviceModel.findUnique({ where: { id }, include: { ports: true } });
    if (!model) throw new NotFoundException('Device model not found');
    if (model.status !== 'DRAFT') throw new BadRequestException('Only DRAFT models can be published');
    if (model.ports.length === 0) throw new BadRequestException('Cannot publish model with no ports');

    return this.prisma.deviceModel.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById },
    });
  }

  async createNewVersion(id: string) {
    const original = await this.prisma.deviceModel.findUnique({
      where: { id },
      include: { ports: true },
    });
    if (!original) throw new NotFoundException('Device model not found');
    if (original.status !== 'PUBLISHED') throw new BadRequestException('Can only version a PUBLISHED model');

    const familyId = original.familyId ?? original.id;

    return this.prisma.deviceModel.create({
      data: {
        name: original.name,
        description: original.description,
        microControllerType: original.microControllerType,
        status: 'DRAFT',
        version: original.version + 1,
        familyId,
        supersedesId: original.id,
        ports: {
          create: original.ports.map((p) => ({
            portKey: p.portKey,
            portTypeId: p.portTypeId,
            microControllerPin: p.microControllerPin,
            description: p.description,
            sortOrder: p.sortOrder,
          })),
        },
      },
      include: { ports: true },
    });
  }
}
