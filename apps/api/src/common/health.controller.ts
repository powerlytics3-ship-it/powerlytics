import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "powerlytic-api" };
  }

  @Get("ready")
  ready() {
    return { status: "ready" };
  }
}
