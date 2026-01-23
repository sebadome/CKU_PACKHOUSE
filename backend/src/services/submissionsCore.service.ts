// backend/src/services/submissionsCore.service.ts
import { getPool, sql } from "../db/pool";

type AnyObj = Record<string, any>;

function safeJsonStringify(obj: any, maxLen = 2_000_000): string {
  // NVARCHAR(MAX) aguanta mucho, pero igual evitamos payloads absurdos.
  // También evitamos circular refs.
  const seen = new WeakSet();
  const json = JSON.stringify(
    obj,
    (_k, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    0
  );
  if (json.length <= maxLen) return json;
  return json.slice(0, maxLen) + `... (TRUNCATED ${json.length - maxLen} chars)`;
}

export async function upsertCkuSubmissionRaw(payload: AnyObj) {
  const pool = await getPool();

  const submissionId = payload?.id;
  const templateId = payload?.templateId ?? "";
  const templateTitle = payload?.template?.title ?? "";
  const templateVersion = payload?.template?.version ?? payload?.template?.templateVersion ?? "";

  const status = payload?.status ?? "";
  const createdAt = payload?.createdAt ? new Date(payload.createdAt) : null;
  const updatedAt = payload?.updatedAt ? new Date(payload.updatedAt) : null;

  const submittedBy = payload?.submittedBy ?? "";

  const userId = payload?.user?.id ?? payload?.user?.userId ?? "";
  const userName = payload?.user?.name ?? "";
  const userEmail = payload?.user?.email ?? "";

  // Algunos payload traen planta/temporada arriba y/o dentro de data.encabezado
  const data = payload?.data ?? {};
  const planta =
    payload?.planta ??
    data?.planta ??
    data?.encabezado?.planta ??
    "";
  const temporada =
    data?.temporada ??
    data?.encabezado?.temporada ??
    "";
  const tipoFruta =
    data?.tipo_fruta ??
    data?.encabezado?.tipo_fruta ??
    "";

  const dataJson = safeJsonStringify(data);
  const rawJson = safeJsonStringify(payload);

  if (!submissionId) {
    throw new Error("Payload sin id (submission_id). No se puede persistir.");
  }

  const q = `
MERGE dbo.CKU_Submissions AS target
USING (SELECT CAST(@submission_id AS UNIQUEIDENTIFIER) AS submission_id) AS src
ON target.submission_id = src.submission_id
WHEN MATCHED THEN
  UPDATE SET
    template_id = @template_id,
    template_title = @template_title,
    template_version = @template_version,
    status = @status,
    created_at = COALESCE(target.created_at, @created_at),
    updated_at = COALESCE(@updated_at, SYSUTCDATETIME()),
    submitted_by = @submitted_by,
    user_id = @user_id,
    user_name = @user_name,
    user_email = @user_email,
    planta = @planta,
    temporada = @temporada,
    tipo_fruta = @tipo_fruta,
    data_json = @data_json,
    raw_submission_json = @raw_submission_json
WHEN NOT MATCHED THEN
  INSERT (
    submission_id, template_id, template_title, template_version, status,
    created_at, updated_at, submitted_by,
    user_id, user_name, user_email,
    planta, temporada, tipo_fruta,
    data_json, raw_submission_json
  )
  VALUES (
    CAST(@submission_id AS UNIQUEIDENTIFIER), @template_id, @template_title, @template_version, @status,
    COALESCE(@created_at, SYSUTCDATETIME()), COALESCE(@updated_at, SYSUTCDATETIME()), @submitted_by,
    @user_id, @user_name, @user_email,
    @planta, @temporada, @tipo_fruta,
    @data_json, @raw_submission_json
  );
`;

  await pool
    .request()
    .input("submission_id", sql.UniqueIdentifier, submissionId)
    .input("template_id", sql.NVarChar(50), templateId)
    .input("template_title", sql.NVarChar(200), templateTitle)
    .input("template_version", sql.NVarChar(50), templateVersion)
    .input("status", sql.NVarChar(50), status)
    .input("created_at", sql.DateTime2, createdAt)
    .input("updated_at", sql.DateTime2, updatedAt)
    .input("submitted_by", sql.NVarChar(200), submittedBy)
    .input("user_id", sql.NVarChar(100), userId)
    .input("user_name", sql.NVarChar(200), userName)
    .input("user_email", sql.NVarChar(200), userEmail)
    .input("planta", sql.NVarChar(100), String(planta ?? ""))
    .input("temporada", sql.NVarChar(50), String(temporada ?? ""))
    .input("tipo_fruta", sql.NVarChar(50), String(tipoFruta ?? ""))
    .input("data_json", sql.NVarChar(sql.MAX), dataJson)
    .input("raw_submission_json", sql.NVarChar(sql.MAX), rawJson)
    .query(q);
}

export async function auditEvent(params: {
  event_type: string;
  result: string;
  submission_id?: string;
  template_id?: string;
  template_title?: string;
  user_name?: string;
  user_id?: string;
  user_email?: string;
  error_message?: string;
  details?: AnyObj;
}) {
  const pool = await getPool();

  const detailsJson = params.details ? safeJsonStringify(params.details) : null;

  const q = `
INSERT INTO dbo.CKU_APP_AUDIT_LOG (
  event_time_utc, event_type, result,
  submission_id, template_id, template_title,
  user_name, user_id, user_email,
  error_message, details_json
)
VALUES (
  SYSUTCDATETIME(), @event_type, @result,
  @submission_id, @template_id, @template_title,
  @user_name, @user_id, @user_email,
  @error_message, @details_json
);
`;

  await pool
    .request()
    .input("event_type", sql.NVarChar(60), params.event_type)
    .input("result", sql.NVarChar(30), params.result)
    .input("submission_id", sql.UniqueIdentifier, params.submission_id ?? null)
    .input("template_id", sql.NVarChar(50), params.template_id ?? "")
    .input("template_title", sql.NVarChar(200), params.template_title ?? "")
    .input("user_name", sql.NVarChar(200), params.user_name ?? "")
    .input("user_id", sql.NVarChar(100), params.user_id ?? "")
    .input("user_email", sql.NVarChar(200), params.user_email ?? "")
    .input("error_message", sql.NVarChar(sql.MAX), params.error_message ?? "")
    .input("details_json", sql.NVarChar(sql.MAX), detailsJson)
    .query(q);
}
