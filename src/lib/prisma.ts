import 'server-only';
import { PrismaClient } from '../generated/client';


// Prevent multiple client instances in Next.js dev (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
