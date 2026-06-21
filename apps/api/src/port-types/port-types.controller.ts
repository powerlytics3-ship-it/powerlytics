import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { portTypeSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller("port-types")
export class PortTypesController {
  constructor(private readonly state: AppStateService) {}

  @Get()
  @RequirePermission(Permission.DEVICE_MODEL_READ)
  list() {
    return this.state.listPortTypes();
  }

  @Post()
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  create(@Body() body: unknown) {
    return this.state.createPortType(portTypeSchema.parse(body));
  }

  @Get(":id")
  @RequirePermission(Permission.DEVICE_MODEL_READ)
  async detail(@Param("id") id: string) {
    const portTypes = await this.state.listPortTypes();
    return portTypes.find((item) => item.id === id);
  }

  @Put(":id")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.state.updatePortType(id, body);
  }

  @Post(":id/deactivate")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  deactivate(@Param("id") id: string) {
    return this.state.deactivatePortType(id);
  }

  @Delete(":id")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  delete(@Param("id") id: string) {
    return this.state.deactivatePortType(id);
  }
}
