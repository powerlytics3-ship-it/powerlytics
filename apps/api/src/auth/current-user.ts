import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Role } from "@powerlytic/types";

export type RequestUser = {
  id: string;
  externalSub?: string;
  email: string;
  roles: Role[];
  workspaceId?: string;
  workspaceIds: string[];
  authType?: "human" | "device" | "demo";
  deviceId?: string;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): RequestUser | undefined => {
  const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
  return request.user;
});
