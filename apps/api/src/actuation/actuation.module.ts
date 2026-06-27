import { Module } from '@nestjs/common';
import { ActuationController } from './actuation.controller';
import { ActuationService } from './actuation.service';
import { BridgeClient } from '../config-deployment/bridge.client';

@Module({
  controllers: [ActuationController],
  providers: [ActuationService, BridgeClient],
})
export class ActuationModule {}
