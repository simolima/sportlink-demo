// Use require to avoid TypeScript complaints about module exports in some environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PrismaPkg: any = require('@prisma/client')
const PrismaClient = PrismaPkg.PrismaClient
const globalForPrisma = global as unknown as { prisma: any };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalForPrisma as any).prisma = prisma;
