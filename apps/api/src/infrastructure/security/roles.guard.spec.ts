import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import { UserRole } from '@ddd/shared';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: jest.Mocked<Reflector>;

    beforeEach(() => {
        reflector = {
            getAllAndOverride: jest.fn(),
        } as any;
        guard = new RolesGuard(reflector);
    });

    const mockContext = (userObj: any) => ({
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
            getRequest: () => ({ user: userObj }),
        }),
    } as unknown as ExecutionContext);

    it('should allow access if no roles are required', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        expect(guard.canActivate(mockContext({}))).toBe(true);
    });

    it('should block access if user has no role defined', () => {
        reflector.getAllAndOverride.mockReturnValue([UserRole.ORGANIZER]);
        expect(() => guard.canActivate(mockContext({ id: '1' }))).toThrowError(ForbiddenException);
        expect(() => guard.canActivate(mockContext({ id: '1' }))).toThrowError('Access denied. No valid role associated with this request.');
    });

    it('should block access if user role does not match required roles', () => {
        reflector.getAllAndOverride.mockReturnValue([UserRole.ORGANIZER]);
        expect(() => guard.canActivate(mockContext({ id: '1', role: UserRole.USER }))).toThrowError(ForbiddenException);
        expect(() => guard.canActivate(mockContext({ id: '1', role: UserRole.USER }))).toThrowError('Access denied. Action requires one of these roles: ORGANIZER');
    });

    it('should allow access if user role matches one of the required roles', () => {
        reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.ORGANIZER]);
        expect(guard.canActivate(mockContext({ id: '1', role: UserRole.ORGANIZER }))).toBe(true);
    });
});
