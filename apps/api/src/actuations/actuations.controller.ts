import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { createActuationSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller("devices/:deviceId/actuations")
export class ActuationsController {
  constructor(private readonly state: AppStateService) {}

  @Get()
  @RequirePermission(Permission.ACTUATION_CREATE)
  list(@Param("deviceId") deviceId: string) {
    return this.state.listActuations(deviceId);
  }

  @Post()
  @RequirePermission(Permission.ACTUATION_CREATE)
  create(@Param("deviceId") deviceId: string, @Body() body: unknown) {
    return this.state.createActuation(deviceId, createActuationSchema.parse(body));
  }

  @Get(":actuationId")
  @RequirePermission(Permission.ACTUATION_CREATE)
  async detail(@Param("deviceId") deviceId: string, @Param("actuationId") actuationId: string) {
    const actuations = await this.state.listActuations(deviceId);
    return actuations.find((item) => item.id === actuationId);
  }

  @Post(":actuationId/cancel")
  @RequirePermission(Permission.ACTUATION_CREATE)
  cancel(@Param("deviceId") deviceId: string, @Param("actuationId") actuationId: string) {
    return this.state.updateActuation(deviceId, actuationId, { status: "CANCELLED" });
  }

  @Post(":actuationId/retry")
  @RequirePermission(Permission.ACTUATION_CREATE)
  retry(@Param("deviceId") deviceId: string, @Param("actuationId") actuationId: string) {
    return this.state.updateActuation(deviceId, actuationId, { status: "PENDING" });
  }
}
