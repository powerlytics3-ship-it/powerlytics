import type { Role } from "@powerlytic/types";

type AppSessionUser = {
  id: string;
  email: string;
  name: string | null;
  workspaceId: string;
  workspaceIds: string[];
  roles: Role[];
  apiToken: string;
};

declare module "next-auth" {
  interface Session {
    user: AppSessionUser;
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    roles?: Role[];
    workspaceId?: string;
    workspaceIds?: string[];
    apiToken?: string;
  }
}
