import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "./auth/auth.controller.js";
import { JwtAuthGuard } from "./auth/jwt-auth.guard.js";
import { RequestContextMiddleware, RequestContextService } from "./auth/request-context.service.js";
import { AuditController } from "./audit/audit.controller.js";
import { AlertsController } from "./alerts/alerts.controller.js";
import { ActuationsController } from "./actuations/actuations.controller.js";
import { PermissionGuard } from "./authorization/permission.guard.js";
import { AppStateService } from "./common/app-state.service.js";
import { DemoStateService } from "./demo/demo-state.service.js";
import { DevicesController } from "./devices/devices.controller.js";
import { LegacyDeviceController } from "./devices/legacy-device.controller.js";
import { DeviceModelsController } from "./device-models/device-models.controller.js";
import { HealthController } from "./common/health.controller.js";
import { PortTypesController } from "./port-types/port-types.controller.js";
import { PrismaService } from "./prisma/prisma.service.js";
import { ProductionStateService } from "./production/production-state.service.js";
import { QueueProducerService } from "./queues/queue-producer.service.js";
import { MqttService } from "./realtime/mqtt.service.js";
import { TelemetryController } from "./telemetry/telemetry.controller.js";
import { UsersController } from "./users/users.controller.js";
import { WorkspacesController } from "./workspaces/workspaces.controller.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    WorkspacesController,
    PortTypesController,
    DeviceModelsController,
    DevicesController,
    LegacyDeviceController,
    TelemetryController,
    AlertsController,
    ActuationsController,
    AuditController
  ],
  providers: [
    AppStateService,
    DemoStateService,
    ProductionStateService,
    PrismaService,
    QueueProducerService,
    MqttService,
    RequestContextService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
