/**
 * Pre-Embarque Service (REG.CKU.027)
 * Servicio para normalización y validación de datos de pre-embarque
 */

import { getPool, sql } from "../db/pool";
import { auditEvent } from "./submissionsCore.service";

interface PreEmbarqueHealthStatus {
  status: "ok" | "pending" | "error";
  message: string;
  submissionId: string;
  details?: {
    mainRecord: boolean;
    inspecciones: number;
    presiones: number;
    hallazgos: number;
  };
}

// Helper: Validar UUID
function toUuidOrThrow(id: string): string {
  const s = String(id ?? "").trim();
  const re = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  if (!re.test(s)) throw new Error(`submissionId inválido (no UUID): "${s}"`);
  return s;
}

// Helper: Auditoría best-effort
async function auditBestEffort(params: Parameters<typeof auditEvent>[0]) {
  try {
    if (!params.result) {
      (params as any).result = "OK";
    }
    await auditEvent(params);
  } catch (e) {
    console.warn("[PreEmbarque] auditEvent falló (best effort):", (e as any)?.message ?? e);
  }
}

/**
 * Obtiene counts para el router (health_status + métricas clave)
 */
async function getPreEmbarqueCounts(submissionId: string): Promise<Record<string, any>> {
  const pool = await getPool();

  const r = await pool
    .request()
    .input("submission_id", sql.UniqueIdentifier, submissionId)
    .query(`
      SELECT
        main_rows = (SELECT COUNT(*) FROM dbo.PRE_EMBARQUE WHERE submission_id = @submission_id),
        inspecciones = (SELECT COUNT(*) FROM dbo.PRE_EMBARQUE_INSPECCION WHERE submission_id = @submission_id),
        presiones = (
          SELECT COUNT(*)
          FROM dbo.PRE_EMBARQUE_PRESIONES p
          INNER JOIN dbo.PRE_EMBARQUE_INSPECCION i ON p.inspeccion_id = i.id
          WHERE i.submission_id = @submission_id
        ),
        hallazgos = (
          SELECT COUNT(*)
          FROM dbo.PRE_EMBARQUE_HALLAZGOS h
          INNER JOIN dbo.PRE_EMBARQUE_INSPECCION i ON h.inspeccion_id = i.id
          WHERE i.submission_id = @submission_id
        ),
        processed_utc = (SELECT TOP 1 processed_utc FROM dbo.PRE_EMBARQUE WHERE submission_id = @submission_id)
    `);

  const row = r.recordset?.[0] ?? {};
  const mainRows = Number(row.main_rows ?? 0);

  const health_status = mainRows > 0 ? "OK" : "FAIL";

  return {
    health_status,
    processed_utc: row.processed_utc ?? null,
    main_rows: mainRows,
    inspecciones: Number(row.inspecciones ?? 0),
    presiones: Number(row.presiones ?? 0),
    hallazgos: Number(row.hallazgos ?? 0),
  };
}

/**
 * Verifica el estado de salud de un submission
 */
export async function getPreEmbarqueHealth(submissionIdRaw: string): Promise<PreEmbarqueHealthStatus> {
  const submissionId = toUuidOrThrow(submissionIdRaw);
  const pool = await getPool();

  try {
    const mainResult = await pool
      .request()
      .input("submission_id", sql.UniqueIdentifier, submissionId)
      .query(`
        SELECT
          COUNT(*) AS count,
          (SELECT COUNT(*) FROM dbo.PRE_EMBARQUE_INSPECCION WHERE submission_id = @submission_id) AS inspecciones,
          (SELECT COUNT(*)
           FROM dbo.PRE_EMBARQUE_PRESIONES p
           INNER JOIN dbo.PRE_EMBARQUE_INSPECCION i ON p.inspeccion_id = i.id
           WHERE i.submission_id = @submission_id) AS presiones,
          (SELECT COUNT(*)
           FROM dbo.PRE_EMBARQUE_HALLAZGOS h
           INNER JOIN dbo.PRE_EMBARQUE_INSPECCION i ON h.inspeccion_id = i.id
           WHERE i.submission_id = @submission_id) AS hallazgos
        FROM dbo.PRE_EMBARQUE
        WHERE submission_id = @submission_id
      `);

    const record = mainResult.recordset?.[0] ?? {};
    const exists = Number(record.count ?? 0) > 0;

    if (!exists) {
      return {
        status: "pending",
        message: "Datos no normalizados aún",
        submissionId,
      };
    }

    return {
      status: "ok",
      message: "Datos normalizados correctamente",
      submissionId,
      details: {
        mainRecord: true,
        inspecciones: Number(record.inspecciones ?? 0),
        presiones: Number(record.presiones ?? 0),
        hallazgos: Number(record.hallazgos ?? 0),
      },
    };
  } catch (error) {
    console.error("Error checking PreEmbarque health:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Error desconocido",
      submissionId,
    };
  }
}

/**
 * Normaliza los datos ejecutando el SP
 */
export async function normalizePreEmbarqueData(
  submissionIdRaw: string
): Promise<{
  success: boolean;
  message: string;
  submissionId: string;
}> {
  const submissionId = toUuidOrThrow(submissionIdRaw);
  const pool = await getPool();

  try {
    console.log(`[PreEmbarque] Iniciando normalización para submission: ${submissionId}`);

    await pool
      .request()
      .input("submission_id", sql.UniqueIdentifier, submissionId)
      .execute("dbo.usp_Load_PRE_EMBARQUE");

    console.log(`[PreEmbarque] Normalización exitosa para submission: ${submissionId}`);

    await auditBestEffort({
      event_type: "pre_embarque_normalized",
      result: "OK",
      submission_id: submissionId,
      template_id: "REG.CKU.027",
      details: { template_id: "REG.CKU.027" },
    });

    return {
      success: true,
      message: "Datos de Pre-Embarque normalizados exitosamente",
      submissionId,
    };
  } catch (error) {
    console.error("[PreEmbarque] Error en normalización:", error);

    await auditBestEffort({
      event_type: "pre_embarque_normalization_error",
      result: "FAIL",
      submission_id: submissionId,
      template_id: "REG.CKU.027",
      error_message: error instanceof Error ? error.message : "Error desconocido",
      details: {
        template_id: "REG.CKU.027",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
    });

    throw error;
  }
}

/**
 * Finaliza un submission (función principal para el router)
 */
export async function finalizePreEmbarque(
  submissionIdRaw: string
): Promise<{
  submissionId: string;
  counts: Record<string, any>;
}> {
  const submissionId = toUuidOrThrow(submissionIdRaw);

  // 1) Normalizar
  await normalizePreEmbarqueData(submissionId);

  // 2) Health
  const health = await getPreEmbarqueHealth(submissionId);

  // 3) Counts para el router
  const counts = await getPreEmbarqueCounts(submissionId);

  if (health.status !== "ok") {
    counts.health_status = "FAIL";
    counts.health_message = health.message;
  }

  // Auditar finalize
  await auditBestEffort({
    event_type: "pre_embarque_finalize",
    result: counts.health_status === "OK" ? "OK" : "FAIL",
    submission_id: submissionId,
    template_id: "REG.CKU.027",
    details: { counts, health },
  });

  return { submissionId, counts };
}

/**
 * Obtiene estadísticas de completitud
 */
export async function getPreEmbarqueCompletitudStats(submissionIdRaw: string): Promise<{
  inspecciones: { total: number; aprobadas: number; rechazadas: number };
  presiones: { completitud: number; frutosEsperados: number; frutosCapturados: number };
}> {
  const submissionId = toUuidOrThrow(submissionIdRaw);
  const pool = await getPool();

  try {
    const inspeccionesResult = await pool
      .request()
      .input("submission_id", sql.UniqueIdentifier, submissionId)
      .query(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN resolucion = 'Aprobado' THEN 1 ELSE 0 END) AS aprobadas,
          SUM(CASE WHEN resolucion = 'Rechazado' THEN 1 ELSE 0 END) AS rechazadas
        FROM dbo.PRE_EMBARQUE_INSPECCION
        WHERE submission_id = @submission_id
      `);

    const presionesResult = await pool
      .request()
      .input("submission_id", sql.UniqueIdentifier, submissionId)
      .query(`
        SELECT
          SUM(i.n_frutos) AS frutos_esperados,
          COUNT(p.id) AS frutos_capturados,
          CASE 
            WHEN SUM(i.n_frutos) > 0 THEN
              CAST(COUNT(p.id) AS FLOAT) / CAST(SUM(i.n_frutos) AS FLOAT) * 100
            ELSE 0
          END AS completitud
        FROM dbo.PRE_EMBARQUE_INSPECCION i
        LEFT JOIN dbo.PRE_EMBARQUE_PRESIONES p ON i.id = p.inspeccion_id
        WHERE i.submission_id = @submission_id
      `);

    return {
      inspecciones: {
        total: Number(inspeccionesResult.recordset?.[0]?.total ?? 0),
        aprobadas: Number(inspeccionesResult.recordset?.[0]?.aprobadas ?? 0),
        rechazadas: Number(inspeccionesResult.recordset?.[0]?.rechazadas ?? 0),
      },
      presiones: {
        completitud: Number(presionesResult.recordset?.[0]?.completitud ?? 0),
        frutosEsperados: Number(presionesResult.recordset?.[0]?.frutos_esperados ?? 0),
        frutosCapturados: Number(presionesResult.recordset?.[0]?.frutos_capturados ?? 0),
      },
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de completitud:", error);
    throw error;
  }
}