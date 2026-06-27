import { Module } from '@nestjs/common';
import { PortTypesController } from './port-types.controller';
import { PortTypesService } from './port-types.service';

@Module({
  controllers: [PortTypesController],
  providers: [PortTypesService],
  exports: [PortTypesService],
})
export class PortTypesModule {}
