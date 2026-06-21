import { Controller, Get, Param } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller()
export class AuditController {
  constructor(private readonly state: AppStateService) {}

  @Get("audit-logs")
  @RequirePermission(Permission.AUDIT_READ)
  list() {
    return this.state.listAuditLogs();
  }

  @Get("organizations/:orgId/audit-logs")
  @RequirePermission(Permission.AUDIT_READ)
  async organizationLogs(@Param("orgId") orgId: string) {
    const logs = await this.state.listAuditLogs();
    return logs.filter((item) => item.workspaceId === orgId);
  }

  @Get("devices/:deviceId/audit-logs")
  @RequirePermission(Permission.AUDIT_READ)
  async deviceLogs(@Param("deviceId") deviceId: string) {
    const logs = await this.state.listAuditLogs();
    return logs.filter((item) => item.resource === "device" && item.resourceId === deviceId);
  }
}
