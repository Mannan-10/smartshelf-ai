import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) {
      console.error(
        '[PrismaService] ERROR: Neither DATABASE_URL nor DIRECT_URL is set in environment variables!',
      );
    }
    const adapter = new PrismaPg({
      connectionString: connectionString as string,
    });

    super({ adapter });
  }
}
