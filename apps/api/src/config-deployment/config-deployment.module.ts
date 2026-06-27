import { Module } from '@nestjs/common';
import { ConfigDeploymentController } from './config-deployment.controller';
import { ConfigDeploymentService } from './config-deployment.service';
import { BridgeClient } from './bridge.client';

@Module({
  controllers: [ConfigDeploymentController],
  providers: [ConfigDeploymentService, BridgeClient],
  exports: [ConfigDeploymentService],
})
export class ConfigDeploymentModule {}
