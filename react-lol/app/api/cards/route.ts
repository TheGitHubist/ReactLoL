const API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const ATTRIBUTES = new Set(["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"]);
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

function boundedInteger(value: string | null, fallback: number, max: number) {
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(parsed, max) : null;
}

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  const allCards = incoming.get("all") === "true";
  const id = incoming.get("id");
  const name = incoming.get("name")?.trim().slice(0, 100);
  const archetype = incoming.get("archetype")?.trim().slice(0, 80);
  const type = incoming.get("type")?.trim().slice(0, 80);
  const race = incoming.get("race")?.trim().slice(0, 40);
  const attribute = incoming.get("attribute")?.toUpperCase();
  const minAtk = incoming.get("minAtk");
  const maxAtk = incoming.get("maxAtk");
  const minDef = incoming.get("minDef");
  const maxDef = incoming.get("maxDef");
  const num = boundedInteger(incoming.get("num"), 36, 50);
  const offset = boundedInteger(incoming.get("offset"), 0, 50000);

  if (id) {
    if (!/^\d{1,20}$/.test(id)) return jsonResponse({ error: "Card ID must contain only digits." }, 400);
    params.set("id", id);
  }
  params.set("misc", "yes");
  if (name) params.set("fname", name);
  if (archetype) params.set("archetype", archetype);
  if (type) params.set("type", type);
  if (race) params.set("race", race);
  if (attribute && !ATTRIBUTES.has(attribute)) {
    return jsonResponse({ error: "Choose a valid card attribute." }, 400);
  }
  if (attribute) params.set("attribute", attribute);

  const numericFilters = [minAtk, maxAtk, minDef, maxDef];
  if (numericFilters.some((value) => value && !/^\d+$/.test(value))) {
    return jsonResponse({ error: "ATK and DEF filters must be non-negative whole numbers." }, 400);
  }
  if (num === null || offset === null) {
    return jsonResponse({ error: "Page size and offset must be non-negative whole numbers." }, 400);
  }
  if (minAtk || maxAtk) params.set("atk", minAtk ? `gte${minAtk}` : `lte${maxAtk}`);
  if (minDef || maxDef) params.set("def", minDef ? `gte${minDef}` : `lte${maxDef}`);
  if (!id && !archetype && !allCards) {
    params.set("num", String(Math.max(num, 1)));
    params.set("offset", String(offset));
  }

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const body: unknown = await response.json();
    if (allCards && response.ok && body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
      const sourceCards = (body as { data: Record<string, unknown>[] }).data;
      const data = sourceCards.map((card) => ({
        id: card.id,
        name: card.name,
        type: card.type,
        desc: "",
        frameType: card.frameType,
        attribute: card.attribute,
        race: card.race,
        archetype: card.archetype,
        level: card.level,
        atk: card.atk,
        def: card.def,
        linkval: card.linkval,
        card_images: Array.isArray(card.card_images)
          ? card.card_images.slice(0, 1).map((image) => {
            if (!image || typeof image !== "object") return image;
            const value = image as Record<string, unknown>;
            return { id: value.id, image_url: value.image_url, image_url_small: value.image_url_small };
          })
          : [],
        banlist_info: card.banlist_info,
      }));
      return jsonResponse({ data, meta: { total_rows: data.length } }, response.status);
    }
    return jsonResponse(body, response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Yu-Gi-Oh! card service is unavailable.";
    return jsonResponse({ error: message }, 502);
  }
}
