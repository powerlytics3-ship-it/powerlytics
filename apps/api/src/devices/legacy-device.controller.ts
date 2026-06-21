import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { deploymentStatusCallbackSchema } from "@powerlytic/validators";
import { AppStateService } from "../common/app-state.service.js";

@Controller("device")
export class LegacyDeviceController {
  constructor(private readonly state: AppStateService) {}

  @Get(":id/config")
  config(@Param("id") id: string) {
    return this.state.buildDeviceConfig(id);
  }

  @Post(":id/deploy")
  deploy(@Param("id") id: string) {
    return {
      message: "Config deployment initiated",
      deployment: this.state.deployConfig(id)
    };
  }

  @Get(":id/deployment-status")
  status(@Param("id") id: string) {
    return this.state.getDeploymentStatus(id);
  }

  @Put(":id/deployment-status")
  updateStatus(@Param("id") id: string, @Body() body: unknown) {
    return {
      message: "Deployment status updated",
      deployment: this.state.updateDeploymentStatus(id, deploymentStatusCallbackSchema.parse(body))
    };
  }
}
