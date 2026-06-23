import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { Permission, hasPermission } from "@powerlytic/authz";
import { Role } from "@powerlytic/types";
import { authOptions } from "../auth.config";

type PermissionGateProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export async function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles ?? []) as Role[];
  const allowed = roles.some((role) => hasPermission(role, permission));

  return allowed ? <>{children}</> : <>{fallback}</>;
}
