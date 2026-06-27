import { SetMetadata } from '@nestjs/common';
import { Resource, Action } from '@powerlytic/permissions';

export const PERMISSION_KEY = 'required_permission';

export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

export const Public = () => SetMetadata('isPublic', true);
