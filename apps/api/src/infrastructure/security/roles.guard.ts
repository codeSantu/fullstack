import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '@ddd/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No roles defined, meaning route is open
        }

        const { user } = context.switchToHttp().getRequest();

        // In our implementation User context should have been decoded from JWT middleware
        if (!user || !user.role) {
            throw new ForbiddenException('Access denied. No valid role associated with this request.');
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(`Access denied. Action requires one of these roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
