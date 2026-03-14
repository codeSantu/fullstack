import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class LogService {
    constructor(private readonly prisma: PrismaService) { }

    async logAction(action: string, festivalId: string, userId: string, details?: string): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                action,
                festivalId,
                userId,
                details,
            },
        });
    }
}
