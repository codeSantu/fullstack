import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.TURSO_DB_URL || process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
});
