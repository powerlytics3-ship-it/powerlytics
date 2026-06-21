import { describe, expect, it } from "vitest";
import { LegacyRole, Role } from "@powerlytic/types";
import { hasPermission, mapLegacyRole, Permission } from "./index";

describe("authz", () => {
  it("maps legacy roles into workspace roles", () => {
    expect(mapLegacyRole(LegacyRole.CompanyAdmin)).toBe(Role.SUPER_ADMIN);
    expect(mapLegacyRole(LegacyRole.OrgAdmin)).toBe(Role.WORKSPACE_ADMIN);
    expect(mapLegacyRole(LegacyRole.OrgUser)).toBe(Role.OPERATOR);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission(Role.VIEWER, Permission.TELEMETRY_READ)).toBe(true);
    expect(hasPermission(Role.VIEWER, Permission.ACTUATION_CREATE)).toBe(false);
  });
});
