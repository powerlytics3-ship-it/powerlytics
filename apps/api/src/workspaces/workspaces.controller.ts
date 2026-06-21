import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { Permission } from "@powerlytic/authz";
import { workspaceSchema, invitationSchema } from "@powerlytic/validators";
import { RequirePermission } from "../authorization/require-permission.decorator.js";
import { AppStateService } from "../common/app-state.service.js";

@Controller()
export class WorkspacesController {
  constructor(private readonly state: AppStateService) {}

  @Get("workspaces")
  @RequirePermission(Permission.WORKSPACE_READ)
  list() {
    return this.state.listWorkspaces();
  }

  @Post("workspaces")
  @RequirePermission(Permission.WORKSPACE_MANAGE)
  create(@Body() body: unknown) {
    return this.state.createWorkspace(workspaceSchema.parse(body));
  }

  @Get("workspaces/:workspaceId")
  @RequirePermission(Permission.WORKSPACE_READ)
  detail(@Param("workspaceId") workspaceId: string) {
    return this.state.getWorkspace(workspaceId);
  }

  @Get("workspaces/:workspaceId/memberships")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  memberships(@Param("workspaceId") workspaceId: string) {
    return this.state.listMemberships(workspaceId);
  }

  @Post("workspaces/:workspaceId/invitations")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  invite(@Param("workspaceId") workspaceId: string, @Body() body: unknown) {
    const invite = invitationSchema.parse(body);
    return this.state.createInvitation(workspaceId, invite);
  }

  @Get("workspaces/:workspaceId/invitations")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  invitations(@Param("workspaceId") workspaceId: string) {
    return this.state.listInvitations(workspaceId);
  }

  @Delete("workspaces/:workspaceId/memberships/:membershipId")
  @RequirePermission(Permission.MEMBERSHIP_MANAGE)
  removeMembership(@Param("workspaceId") workspaceId: string, @Param("membershipId") membershipId: string) {
    return this.state.removeMembership(workspaceId, membershipId);
  }

  @Get("organizations")
  @RequirePermission(Permission.WORKSPACE_READ)
  async organizations() {
    const workspaces = await this.state.listWorkspaces();
    return workspaces.filter((workspace) => workspace.kind === "ORGANIZATION");
  }

  @Post("organizations")
  @RequirePermission(Permission.WORKSPACE_MANAGE)
  createOrganization(@Body() body: unknown) {
    return this.create({ ...(body as Record<string, unknown>), kind: "ORGANIZATION" });
  }

  @Get("organizations/:orgId")
  @RequirePermission(Permission.WORKSPACE_READ)
  async organizationDetail(@Param("orgId") orgId: string) {
    const workspace = await this.state.getWorkspace(orgId);
    return {
      organization: workspace,
      users: [await this.state.me()],
      devices: await this.state.listDevices({ workspaceId: workspace.id })
    };
  }
}
