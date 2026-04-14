import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type UserRole = 'ADMIN' | 'OPERADOR' | 'LABORATORIO' | 'MEDICO';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
