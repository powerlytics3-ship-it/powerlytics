import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { Role } from "@powerlytic/types";
import { RequestUser } from "./current-user.js";

type RequestStore = {
  user?: RequestUser;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestStore>();

  run(callback: () => void) {
    this.storage.run({}, callback);
  }

  setUser(user: RequestUser) {
    const store = this.storage.getStore();
    if (store) store.user = user;
  }

  getUser() {
    return this.storage.getStore()?.user;
  }

  isPlatformUser() {
    const roles = this.getUser()?.roles ?? [];
    return roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ENGINEERING_ADMIN) || roles.includes(Role.MANUFACTURER);
  }

  requireWorkspaceScope(requestedWorkspaceId?: string | null) {
    const user = this.getUser();
    if (!user || this.isPlatformUser()) return requestedWorkspaceId ?? undefined;
    const selected = requestedWorkspaceId ?? user.workspaceId;
    if (!selected || !user.workspaceIds.includes(selected)) {
      throw new ForbiddenException("Workspace access denied");
    }
    return selected;
  }

  allowedWorkspaceIds() {
    const user = this.getUser();
    if (!user || this.isPlatformUser()) return undefined;
    return user.workspaceIds;
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(_req: unknown, _res: unknown, next: () => void) {
    this.context.run(next);
  }
}
