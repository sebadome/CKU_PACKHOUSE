// backend/src/utils/teams.ts

type Facts = Record<string, string>;

function trunc(v: any, max = 800): string {
  const s = String(v ?? "");
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function toFactsArray(facts: Facts) {
  return Object.entries(facts)
    .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => ({ title: String(k), value: trunc(v, 800) }));
}

export async function sendTeamsCard(
  webhookUrl: string | undefined,
  title: string,
  message: string,
  facts: Facts = {},
  opts?: { extraText?: string }
) {
  if (!webhookUrl) return;

  const factsArray = toFactsArray(facts);

  const body: any[] = [
    { type: "TextBlock", size: "Large", weight: "Bolder", text: trunc(title, 200), wrap: true },
    { type: "TextBlock", text: trunc(message, 1500), wrap: true },
  ];

  if (factsArray.length > 0) {
    body.push({ type: "FactSet", facts: factsArray });
  }

  if (opts?.extraText && String(opts.extraText).trim()) {
    body.push({
      type: "TextBlock",
      text: trunc(opts.extraText, 2500),
      wrap: true,
      spacing: "Medium",
    });
  }

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body,
        },
      },
    ],
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // No hacemos throw para no botar el flujo principal si Teams falla
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.warn("[TEAMS] non-ok:", resp.status, trunc(txt, 500));
    }
  } catch (err) {
    console.warn("[TEAMS] send failed:", err);
  }
}
