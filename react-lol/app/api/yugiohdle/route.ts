const API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET() {
  try {
    const response = await fetch(`${API_URL}?misc=yes`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const message = body && typeof body === "object" && "error" in body
        ? String(body.error)
        : `Card service returned ${response.status}.`;
      return jsonResponse({ error: message }, response.status);
    }
    if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) {
      return jsonResponse({ error: "Card service returned an unexpected response." }, 502);
    }

    const eligible = ((body as { data: Record<string, unknown>[] }).data)
      .filter((card) =>
        typeof card.name === "string" &&
        typeof card.type === "string" &&
        typeof card.archetype === "string" &&
        card.archetype.trim().length > 0 &&
        !/\bNormal Monster\b/i.test(card.type),
      );
    if (!eligible.length) return jsonResponse({ error: "No eligible cards are available for this round." }, 503);

    const card = eligible[Math.floor(Math.random() * eligible.length)];
    return jsonResponse({
      data: [{
        id: card.id,
        type: card.type,
        frameType: card.frameType,
        race: card.race,
        attribute: card.attribute,
        archetype: card.archetype,
        level: typeof card.level === "number" ? card.level : undefined,
        scale: typeof card.scale === "number" ? card.scale : undefined,
        atk: typeof card.atk === "number" ? card.atk : undefined,
        def: typeof card.def === "number" ? card.def : undefined,
        linkval: typeof card.linkval === "number" ? card.linkval : undefined,
      }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Yu-Gi-Oh! card service is unavailable.";
    return jsonResponse({ error: message }, 502);
  }
}
