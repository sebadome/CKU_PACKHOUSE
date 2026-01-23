// backend/src/services/recepMadPomaceas.service.ts
import { getPool, sql } from "../db/pool";

// =======================
// TYPES (igual estilo que precosecha)
// =======================
export type SubmissionPayload = {
  id: string;
  templateId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  data: Record<string, any>;
  user?: { id?: string; name?: string; email?: string };
  template?: { title?: string; version?: string };
};

// =======================
// TABLE / VIEW NAMES
// =======================
const T = {
  AUDIT: "dbo.CKU_APP_AUDIT_LOG",
  HEALTH: "dbo.vw_RECEP_MAD_POMACEAS_SubmissionHealth",
  SP: "dbo.usp_Load_RECEP_MAD_POMACEAS",
} as const;

// =======================
// SQL
// =======================
const INSERT_AUDIT = `
INSERT INTO ${T.AUDIT} (
  event_time_utc, event_type, result,
  submission_id, template_id, template_title,
  user_name, user_id, user_email,
  error_message, details_json
)
VALUES (
  SYSUTCDATETIME(), @event_type, @result,
  CAST(@submission_id AS UNIQUEIDENTIFIER), @template_id, @template_title,
  @user_name, @user_id, @user_email,
  @error_message, @details_json
);
`;

const SELECT_HEALTH = `
SELECT TOP (1) *
FROM ${T.HEALTH}
WHERE submission_id = CAST(@submission_id AS UNIQUEIDENTIFIER);
`;

// =======================
// HELPERS
// =======================
function j(v: any) {
  return JSON.stringify(v ?? null);
}

function toAuditResult(hs: any): "OK" | "WARN" | "FAIL" {
  const s = String(hs ?? "OK").toUpperCase();
  if (s === "FAIL") return "FAIL";
  if (s === "WARN") return "WARN";
  return "OK";
}

// =======================
// MAIN FINALIZE (REG.CKU.014)
// =======================
export async function finalizeRecepMadurezPomaceas(payload: SubmissionPayload) {
  const pool = await getPool();

  const submissionId = payload.id;
  const template = payload.template ?? {};
  const user = payload.user ?? {};

  if (payload.templateId !== "REG.CKU.014") {
    throw new Error(
      `finalizeRecepMadurezPomaceas llamado con templateId=${payload.templateId} (esperado REG.CKU.014)`
    );
  }

  // Audit START
  {
    const req = pool.request();
    req.input("event_type", sql.NVarChar(60), "FINALIZE_START");
    req.input("result", sql.NVarChar(20), "OK");
    req.input("submission_id", sql.UniqueIdentifier, submissionId);
    req.input("template_id", sql.NVarChar(50), payload.templateId);
    req.input("template_title", sql.NVarChar(200), template.title ?? "RECEP MAD POMACEAS");
    req.input("user_name", sql.NVarChar(200), user.name ?? payload.submittedBy ?? "Usuario (CKU)");
    req.input("user_id", sql.NVarChar(100), user.id ?? "unknown");
    req.input("user_email", sql.NVarChar(200), user.email ?? null);
    req.input("error_message", sql.NVarChar(sql.MAX), null);
    req.input(
      "details_json",
      sql.NVarChar(sql.MAX),
      j({
        source: "backend_api",
        template_version: template.version ?? null,
        status: payload.status ?? null,
      })
    );
    await req.query(INSERT_AUDIT);
  }

  try {
    // 1) Ejecutar SP (esto es lo que lo hace AUTOMÁTICO al finalizar)
    await pool
      .request()
      .input("submission_id", sql.UniqueIdentifier, submissionId)
      .execute(T.SP);

    // 2) Leer Health
    const healthReq = pool.request();
    healthReq.input("submission_id", sql.UniqueIdentifier, submissionId);
    const healthRs = await healthReq.query(SELECT_HEALTH);
    const counts = healthRs.recordset?.[0] ?? {};

    // 3) Audit DONE según health
    {
      const result = toAuditResult(counts?.health_status);

      const req = pool.request();
      req.input("event_type", sql.NVarChar(60), "FINALIZE_DONE");
      req.input("result", sql.NVarChar(20), result);
      req.input("submission_id", sql.UniqueIdentifier, submissionId);
      req.input("template_id", sql.NVarChar(50), payload.templateId);
      req.input("template_title", sql.NVarChar(200), template.title ?? "RECEP MAD POMACEAS");
      req.input("user_name", sql.NVarChar(200), user.name ?? payload.submittedBy ?? "Usuario (CKU)");
      req.input("user_id", sql.NVarChar(100), user.id ?? "unknown");
      req.input("user_email", sql.NVarChar(200), user.email ?? null);
      req.input("error_message", sql.NVarChar(sql.MAX), null);
      req.input(
        "details_json",
        sql.NVarChar(sql.MAX),
        j({
          source: "backend_api",
          counts,
        })
      );
      await req.query(INSERT_AUDIT);
    }

    return {
      submissionId,
      counts,
    };
  } catch (e: any) {
    // Audit FAIL
    const msg = e?.message ?? String(e);

    const req = pool.request();
    req.input("event_type", sql.NVarChar(60), "FINALIZE_FAIL");
    req.input("result", sql.NVarChar(20), "FAIL");
    req.input("submission_id", sql.UniqueIdentifier, submissionId);
    req.input("template_id", sql.NVarChar(50), payload.templateId);
    req.input("template_title", sql.NVarChar(200), template.title ?? "RECEP MAD POMACEAS");
    req.input("user_name", sql.NVarChar(200), user.name ?? payload.submittedBy ?? "Usuario (CKU)");
    req.input("user_id", sql.NVarChar(100), user.id ?? "unknown");
    req.input("user_email", sql.NVarChar(200), user.email ?? null);
    req.input("error_message", sql.NVarChar(sql.MAX), msg);
    req.input(
      "details_json",
      sql.NVarChar(sql.MAX),
      j({
        source: "backend_api",
        stack: String(e?.stack ?? "").slice(0, 50_000),
      })
    );
    await req.query(INSERT_AUDIT);

    throw e;
  }
}
