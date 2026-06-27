import { PERMISSION_MATRIX } from './matrix';
import { Resource, Action } from './resources';
import { AnyRole } from './roles';

export function can(role: AnyRole, resource: Resource, action: Action): boolean {
  const matrix = PERMISSION_MATRIX[role];
  if (!matrix) return false;
  const allowed = matrix[resource];
  if (!allowed) return false;
  return allowed.includes(action);
}
