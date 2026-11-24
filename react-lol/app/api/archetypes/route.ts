const API_URL = "https://db.ygoprodeck.com/api/v7/archetypes.php";
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  try {
    const response = await fetch(API_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const body: unknown = await response.json();
    return Response.json(body, { status: response.status, headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The archetype service is unavailable.";
    return Response.json({ error: message }, { status: 502, headers: NO_STORE });
  }
}
