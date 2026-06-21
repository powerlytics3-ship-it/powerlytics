import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import {
  claimDeviceSchema,
  deploymentStatusCallbackSchema,
  manufactureDeviceSchema,
  updateDeviceSchema
} from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller("devices")
export class DevicesController {
  constructor(private readonly state: AppStateService) {}

  @Get()
  @RequirePermission(Permission.DEVICE_READ)
  list(@Query() query: Record<string, unknown>) {
    return this.state.listDevices(query);
  }

  @Post("manufacture")
  @RequirePermission(Permission.DEVICE_MANUFACTURE)
  manufacture(@Body() body: unknown) {
    return this.state.manufactureDevice(manufactureDeviceSchema.parse(body));
  }

  @Get("inventory")
  @RequirePermission(Permission.DEVICE_READ)
  async inventory() {
    const devices = await this.state.listDevices({});
    return devices.filter((device) => ["MANUFACTURED", "IN_INVENTORY"].includes(device.lifecycleStatus));
  }

  @Post("claim")
  @RequirePermission(Permission.DEVICE_CLAIM)
  claim(@Body() body: unknown) {
    return this.state.claimDevice(claimDeviceSchema.parse(body));
  }

  @Get(":deviceId")
  @RequirePermission(Permission.DEVICE_READ)
  detail(@Param("deviceId") deviceId: string) {
    return this.state.getDevice(deviceId);
  }

  @Patch(":deviceId")
  @RequirePermission(Permission.DEVICE_MANAGE)
  update(@Param("deviceId") deviceId: string, @Body() body: unknown) {
    return this.state.updateDevice(deviceId, updateDeviceSchema.parse(body));
  }

  @Delete(":deviceId")
  @RequirePermission(Permission.DEVICE_MANAGE)
  delete(@Param("deviceId") deviceId: string) {
    return this.state.deleteDevice(deviceId);
  }

  @Post(":deviceId/transfer")
  @RequirePermission(Permission.DEVICE_MANAGE)
  transfer(@Param("deviceId") deviceId: string, @Body() body: Record<string, unknown>) {
    return this.state.updateDevice(deviceId, { workspaceId: body.workspaceId, lifecycleStatus: "ASSIGNED_TO_WORKSPACE" });
  }

  @Get(":deviceId/config")
  @RequirePermission(Permission.DEVICE_READ)
  config(@Param("deviceId") deviceId: string) {
    return this.state.buildDeviceConfig(deviceId);
  }

  @Post(":deviceId/config/deploy")
  @RequirePermission(Permission.DEVICE_DEPLOY_CONFIG)
  deploy(@Param("deviceId") deviceId: string) {
    return {
      message: "Config deployment initiated",
      deployment: this.state.deployConfig(deviceId)
    };
  }

  @Get(":deviceId/config/deployments")
  @RequirePermission(Permission.DEVICE_READ)
  deployments(@Param("deviceId") deviceId: string) {
    return this.state.listDeployments(deviceId);
  }

  @Get(":deviceId/config/deployments/:deploymentId")
  @RequirePermission(Permission.DEVICE_READ)
  async deployment(@Param("deviceId") deviceId: string, @Param("deploymentId") deploymentId: string) {
    const deployments = await this.state.listDeployments(deviceId);
    return deployments.find((deployment) => deployment.id === deploymentId);
  }

  @Get(":deviceId/credentials")
  @RequirePermission(Permission.DEVICE_MANAGE)
  credentials(@Param("deviceId") deviceId: string) {
    return this.state.listDeviceCredentials(deviceId);
  }

  @Post(":deviceId/credentials")
  @RequirePermission(Permission.DEVICE_MANAGE)
  createCredential(@Param("deviceId") deviceId: string, @Body() body: Record<string, unknown>) {
    return this.state.createDeviceCredential(deviceId, body);
  }

  @Post(":deviceId/credentials/:credentialId/revoke")
  @RequirePermission(Permission.DEVICE_MANAGE)
  revokeCredential(@Param("deviceId") deviceId: string, @Param("credentialId") credentialId: string) {
    return this.state.revokeDeviceCredential(deviceId, credentialId);
  }

  @Get(":deviceId/lifecycle-events")
  @RequirePermission(Permission.DEVICE_READ)
  lifecycleEvents(@Param("deviceId") deviceId: string) {
    return this.state.listLifecycleEvents(deviceId);
  }

  @Put(":deviceId/config/deployments/current/status")
  deploymentStatusCallback(@Param("deviceId") deviceId: string, @Body() body: unknown) {
    return {
      message: "Deployment status updated",
      deployment: this.state.updateDeploymentStatus(deviceId, deploymentStatusCallbackSchema.parse(body))
    };
  }
}
