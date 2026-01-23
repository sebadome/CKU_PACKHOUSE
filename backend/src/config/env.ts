// backend/src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),

  SQL_SERVER: z.string(),
  SQL_DATABASE: z.string(),
  SQL_USER: z.string(),
  SQL_PASSWORD: z.string(),

  // nuevos (recomendados)
  SQL_PORT: z.coerce.number().optional(), // default 1433 si no viene
  SQL_ENCRYPT: z.string().optional(),
  SQL_TRUST_SERVER_CERT: z.string().optional(),

  // timeouts/pool (recomendados para Vercel)
  SQL_REQUEST_TIMEOUT_MS: z.coerce.number().optional(),
  SQL_CONNECTION_TIMEOUT_MS: z.coerce.number().optional(),
  SQL_POOL_MAX: z.coerce.number().optional(),
  SQL_POOL_MIN: z.coerce.number().optional(),
  SQL_POOL_IDLE_TIMEOUT_MS: z.coerce.number().optional(),

  TEAMS_WEBHOOK_URL: z.string().optional(),

  // recomendado para proteger /finalize
  API_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

export const sqlConfig = {
  server: env.SQL_SERVER,
  database: env.SQL_DATABASE,
  user: env.SQL_USER,
  password: env.SQL_PASSWORD,
  port: env.SQL_PORT ?? 1433,

  options: {
    encrypt: (env.SQL_ENCRYPT ?? "true").toLowerCase() === "true",
    trustServerCertificate: (env.SQL_TRUST_SERVER_CERT ?? "true")
      .toLowerCase() === "true",
  },

  // IMPORTANTÍSIMO para serverless
  pool: {
    max: env.SQL_POOL_MAX ?? 5,
    min: env.SQL_POOL_MIN ?? 0,
    idleTimeoutMillis: env.SQL_POOL_IDLE_TIMEOUT_MS ?? 30_000,
  },

  requestTimeout: env.SQL_REQUEST_TIMEOUT_MS ?? 120_000,
  connectionTimeout: env.SQL_CONNECTION_TIMEOUT_MS ?? 30_000,
};
