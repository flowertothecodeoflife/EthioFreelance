import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // ── Connection pool limits ─────────────────────────────────────────────
    // Supabase free tier allows max 60 connections total across all clients.
    // With PgBouncer in transaction mode (pgbouncer=true in DATABASE_URL)
    // we only need a small pool here — PgBouncer multiplexes on its side.
    max:             5,    // max simultaneous connections from this process
    min:             0,    // allow pool to shrink to 0 when idle
    idleTimeoutMillis:  30_000,   // close idle clients after 30s
    connectionTimeoutMillis: 10_000,  // fail fast if can't connect in 10s

    // ── Keep-alive prevents "server has closed the connection" errors ───────
    // Supabase pauses free-tier DBs after inactivity; keep-alive pings
    // keep the connection warm and detect stale sockets early.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });

  // Log pool errors so they surface in dev without crashing the process
  pool.on("error", (err) => {
    console.error("[PrismaPool] Idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
