// backend/src/utils/time.ts

type DateTimeParts = {
  dd: string;
  mm: string;
  yyyy: string;
  hh: string;
  mi: string;
  ss: string;
};

function formatParts(parts: DateTimeParts) {
  return `${parts.dd}-${parts.mm}-${parts.yyyy} ${parts.hh}:${parts.mi}:${parts.ss}`;
}

function getPartsInTZ(date: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  return {
    dd: get("day"),
    mm: get("month"),
    yyyy: get("year"),
    hh: get("hour"),
    mi: get("minute"),
    ss: get("second"),
  };
}

export function nowChileString(date = new Date()): string {
  return formatParts(getPartsInTZ(date, "America/Santiago"));
}

export function nowUtcString(date = new Date()): string {
  return formatParts(getPartsInTZ(date, "UTC"));
}

// (opcional, útil para BD/logs)
export function nowUtcIso(date = new Date()): string {
  return date.toISOString();
}
                                                          