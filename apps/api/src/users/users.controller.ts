import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { Role } from "@powerlytic/types";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly state: AppStateService) {}

  @Get()
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  list(@Query() query: Record<string, unknown>) {
    return this.state.listUsers(query);
  }

  @Get("org/:orgID")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  listInOrganization(@Param("orgID") orgID: string) {
    return this.state.listUsers({ workspaceId: orgID });
  }

  @Get(":id")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  detail(@Param("id") id: string) {
    return this.state.getUser(id);
  }

  @Post()
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  create(@Body() body: Record<string, unknown>) {
    return this.state.createUser(body);
  }

  @Put(":id")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.state.updateUser(id, body);
  }

  @Delete(":id")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  delete(@Param("id") id: string) {
    return this.state.deleteUser(id);
  }

  @Post("register-company-admin")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  registerCompanyAdmin(@Body() body: Record<string, unknown>) {
    return this.state.createUser({ ...body, workspaceId: body.workspaceId ?? "ws-platform", role: Role.SUPER_ADMIN });
  }

  @Post("register-organization")
  @RequirePermission(Permission.WORKSPACE_MANAGE)
  async registerOrganizationAndAdmin(@Body() body: Record<string, unknown>) {
    const orgData = (body.orgData ?? body.organization ?? {}) as Record<string, unknown>;
    const adminUser = (body.adminUser ?? body.user ?? {}) as Record<string, unknown>;
    const workspace = await this.state.createWorkspace({
      displayName: orgData.name ?? orgData.displayName,
      slug: orgData.slug ?? String(orgData.name ?? orgData.displayName ?? "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      kind: "ORGANIZATION",
      timezone: orgData.timezone ?? "UTC",
      metadata: orgData
    });
    const user = await this.state.createUser({ ...adminUser, workspaceId: workspace.id, role: Role.WORKSPACE_ADMIN });
    return { organization: workspace, user };
  }

  @Post("register-org-user")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  registerOrgUser(@Body() body: Record<string, unknown>) {
    return this.state.createUser({ ...body, role: body.role ?? Role.OPERATOR });
  }
}
