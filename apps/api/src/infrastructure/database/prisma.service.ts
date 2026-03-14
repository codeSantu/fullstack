import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { tenantContext } from '../context/tenant.context';

@Injectable()
export class PrismaService extends PrismaClient {
    static async create() {
        const url = process.env.TURSO_DB_URL;
        const authToken = process.env.TURSO_TOKEN;

        let client: PrismaService;
        if (url && authToken) {
            console.log('Using Turso LibSQL Database');
            const adapter = new PrismaLibSql({ url, authToken });
            client = new PrismaService({ adapter });
        } else {
            console.log('Using Local SQLite Database');
            client = new PrismaService();
        }

        const extended = client.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        const store = tenantContext.getStore();
                        const orgScopedModels = [
                            'Festival', 'Event', 'Volunteer', 'Donation', 'Announcement', 'GalleryImage',
                            'Member', 'User', 'ChatGroup', 'Task'
                        ];

                        if (store?.organizationId && orgScopedModels.includes(model)) {
                            const anyArgs = args as any;
                            if (['findMany', 'findFirst', 'count'].includes(operation)) {
                                anyArgs.where = { ...anyArgs.where, organizationId: store.organizationId };
                            } else if (operation === 'create') {
                                anyArgs.data = { ...anyArgs.data, organizationId: store.organizationId };
                            } else if (['update', 'updateMany', 'deleteMany'].includes(operation)) {
                                anyArgs.where = { ...anyArgs.where, organizationId: store.organizationId };
                            } else if (operation === 'upsert') {
                                anyArgs.where = { ...anyArgs.where, organizationId: store.organizationId };
                                anyArgs.create = { ...anyArgs.create, organizationId: store.organizationId };
                                anyArgs.update = { ...anyArgs.update, organizationId: store.organizationId };
                            }
                        }
                        return query(args);
                    },
                },
            },
        });

        await (extended as any).$connect();
        return extended;
    }

    constructor(options?: any) {
        super(options);
    }
}
