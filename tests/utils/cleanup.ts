// @ts-nocheck
import { prisma } from '../../src/infrastructure/database/prisma.js';

export async function cleanupDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log('Base de données nettoyée.');
  } catch (error) {
    console.log('Erreur lors du nettoyage (normal si la DB est vide).');
  }
}
