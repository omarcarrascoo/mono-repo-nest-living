import { SetMetadata } from '@nestjs/common';

// This creates a custom decorator key 'roles' that we can read later
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);