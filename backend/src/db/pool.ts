// backend/src/db/pool.ts
import sql from "mssql";
import { sqlConfig } from "../config/env";

declare global {
  // cache global para runtimes serverless (Vercel)
  // eslint-disable-next-line no-var
  var __mssqlPool: sql.ConnectionPool | undefined;
  // eslint-disable-next-line no-var
  var __mssqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

export async function getPool() {
  // 1) Reuso inmediato si ya existe
  if (global.__mssqlPool) return global.__mssqlPool;

  // 2) Si ya hay conexión en progreso, espera esa promesa
  if (global.__mssqlPoolPromise) return global.__mssqlPoolPromise;

  // 3) Crea pool con config (incluye pool/timeouts)
  const pool = new sql.ConnectionPool(sqlConfig);

  global.__mssqlPoolPromise = pool
    .connect()
    .then((p) => {
      global.__mssqlPool = p;

      // Si el pool cae, limpia cache para permitir reconexión en el próximo request
      p.on("error", () => {
        global.__mssqlPool = undefined;
        global.__mssqlPoolPromise = undefined;
      });

      return p;
    })
    .catch((err) => {
      global.__mssqlPoolPromise = undefined;
      throw err;
    });

  return global.__mssqlPoolPromise;
}

export { sql };
