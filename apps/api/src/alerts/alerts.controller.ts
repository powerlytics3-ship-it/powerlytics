import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { createAlertRuleSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller()
export class AlertsController {
  constructor(private readonly state: AppStateService) {}

  @Get("alert-rules")
  @RequirePermission(Permission.TELEMETRY_READ)
  rules() {
    return this.state.listAlerts();
  }

  @Post("alert-rules")
  @RequirePermission(Permission.ALERT_MANAGE)
  createRule(@Body() body: unknown) {
    return this.state.createAlertRule(createAlertRuleSchema.parse(body));
  }

  @Get("alert-rules/:id")
  @RequirePermission(Permission.TELEMETRY_READ)
  async rule(@Param("id") id: string) {
    const alerts = await this.state.listAlerts();
    return alerts.find((alert) => alert.id === id);
  }

  @Put("alert-rules/:id")
  @RequirePermission(Permission.ALERT_MANAGE)
  updateRule(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.state.updateAlertRule(id, body);
  }

  @Post("alert-rules/:id/deactivate")
  @RequirePermission(Permission.ALERT_MANAGE)
  deactivateRule(@Param("id") id: string) {
    return this.state.deactivateAlertRule(id);
  }

  @Get("alert-incidents")
  @RequirePermission(Permission.TELEMETRY_READ)
  incidents() {
    return this.state.listAlertIncidents();
  }

  @Get("alert-incidents/:id")
  @RequirePermission(Permission.TELEMETRY_READ)
  async incident(@Param("id") id: string) {
    const alerts = await this.state.listAlertIncidents();
    return alerts.find((alert) => alert.id === id);
  }

  @Post("alert-incidents/:id/ack")
  @RequirePermission(Permission.ALERT_MANAGE)
  ack(@Param("id") id: string) {
    return this.state.updateAlertIncident(id, { status: "ACKNOWLEDGED", acknowledgedAt: new Date().toISOString() });
  }

  @Post("alert-incidents/:id/resolve")
  @RequirePermission(Permission.ALERT_MANAGE)
  resolve(@Param("id") id: string) {
    return this.state.updateAlertIncident(id, { status: "RESOLVED", resolvedAt: new Date().toISOString() });
  }

  @Post("alerts")
  legacyCreate(@Body() body: Record<string, unknown>) {
    return this.state.createAlertIncident(body);
  }

  @Get("alerts")
  legacyList() {
    return this.state.listAlertIncidents();
  }

  @Get("alerts/:id")
  legacyDetail(@Param("id") id: string) {
    return this.incident(id);
  }

  @Put("alerts/:id")
  legacyUpdate(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.state.updateAlertIncident(id, body);
  }
}
