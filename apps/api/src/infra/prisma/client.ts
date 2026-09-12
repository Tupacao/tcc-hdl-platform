import { PrismaClient } from '@prisma/client';

let client: PrismaClient | null = null;

/**
 * Singleton preguicoso: so conecta quando um repositorio de fato precisa dele.
 * Evita instanciar `PrismaClient` (que valida `DATABASE_URL` no construtor)
 * quando a API sobe em memoria, sem banco configurado.
 */
export function getPrismaClient(): PrismaClient {
  client ??= new PrismaClient();
  return client;
}
