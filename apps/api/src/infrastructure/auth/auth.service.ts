import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Validates user credentials. Returns partial user (no password) or null.
     */
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        // Strip password from returned object
        const { password: _pw, ...result } = user;
        return result;
    }

    /**
     * Signs a JWT for the given authenticated user.
     */
    async login(user: any): Promise<{ access_token: string; user: any }> {
        const payload = { 
            sub: user.id, 
            email: user.email, 
            role: user.role,
            organizationId: user.organizationId 
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
            },
        };
    }

    /**
     * Returns the current user profile from the JWT payload.
     */
    async getMe(userId: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, organizationId: true },
        });
        return user;
    }
}
