import { Prisma, PrismaClient } from '../generated/prisma'

/**
 * Dev-server-safe Prisma singleton — DUAL MODE:
 *
 * 1. DATABASE_URL = "file:..." (local SQLite)  → plain PrismaClient (local dev).
 * 2. DATABASE_URL = "libsql://..." (Turso)     → PrismaLibSql driver adapter
 *    (serverless hosting — Vercel — where a local SQLite file cannot exist).
 *
 * The Turso URL may carry its token as a query param:
 *   libsql://<db>.turso.io?authToken=<token>
 * which keeps deployment to a single env var.
 *
 * The generated client lives at `src/generated/prisma` (see prisma/schema.prisma
 * `output`), so every `prisma generate` / `db:push` refreshes files INSIDE the
 * watched src tree — the dev server picks them up without a restart. This
 * guard additionally recreates the cached instance if it predates the current
 * model set (long-running process, schema evolved since first connect).
 */
const MODEL_NAMES: string[] = Object.values(Prisma.ModelName) as string[]

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function coversAllModels(client: PrismaClient): boolean {
  return MODEL_NAMES.every((name) => name in client)
}

function isTurso(url: string): boolean {
  return url.startsWith('libsql://') || url.startsWith('libsql:') || url.startsWith('https://')
}

/** Extract a clean libsql URL + token from "libsql://host/db?authToken=x". */
function parseTursoUrl(url: string): { url: string; authToken?: string } {
  const parsed = new URL(url)
  const authToken = parsed.searchParams.get('authToken') ?? undefined
  parsed.searchParams.delete('authToken')
  return { url: parsed.toString(), authToken }
}

function createClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  if (isTurso(databaseUrl)) {
    // Serverless / remote (Vercel + Turso) — driver adapter.
    // NOTE: @prisma/adapter-libsql >= 6.15 takes a CONFIG object
    // ({ url, authToken }), not a client instance.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    const { url, authToken } = parseTursoUrl(databaseUrl)
    const adapter = new PrismaLibSQL({
      url,
      ...(authToken ? { authToken } : {}),
      ...(process.env.DATABASE_AUTH_TOKEN
        ? { authToken: process.env.DATABASE_AUTH_TOKEN }
        : {}),
    })
    return new PrismaClient({ adapter })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
}

const cached = globalForPrisma.prisma
export const db =
  cached && coversAllModels(cached)
    ? cached
    : (() => {
        const client = createClient()
        globalForPrisma.prisma = client
        return client
      })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
