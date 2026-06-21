import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { createDeviceModelSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller("device-models")
export class DeviceModelsController {
  constructor(private readonly state: AppStateService) {}

  @Get()
  @RequirePermission(Permission.DEVICE_MODEL_READ)
  list() {
    return this.state.listDeviceModels();
  }

  @Post()
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  create(@Body() body: unknown) {
    return this.state.createDeviceModel(createDeviceModelSchema.parse(body));
  }

  @Get(":modelId")
  @RequirePermission(Permission.DEVICE_MODEL_READ)
  detail(@Param("modelId") modelId: string) {
    return this.state.findDeviceModel(modelId);
  }

  @Post(":modelId/publish")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  publish(@Param("modelId") modelId: string) {
    return this.state.publishDeviceModel(modelId);
  }

  @Post(":modelId/new-version")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  async newVersion(@Param("modelId") modelId: string) {
    const source = await this.state.findDeviceModel(modelId);
    return {
      ...source,
      id: crypto.randomUUID(),
      version: source.version + 1,
      publishedAt: undefined,
      deprecatedAt: undefined
    };
  }

  @Post(":modelId/deprecate")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  async deprecate(@Param("modelId") modelId: string) {
    const model = await this.state.findDeviceModel(modelId);
    model.deprecatedAt = new Date().toISOString();
    return model;
  }

  @Delete(":modelId")
  @RequirePermission(Permission.DEVICE_MODEL_MANAGE)
  delete(@Param("modelId") modelId: string) {
    return this.state.deleteDeviceModel(modelId);
  }
}
