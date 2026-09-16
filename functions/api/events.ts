import {
  validateAnalyticsPayload,
  type AnalyticsPayload,
} from "../../lib/analytics/events";

const MAX_PAYLOAD_BYTES = 512;

type AnalyticsEngineDataset = {
  writeDataPoint(point: { blobs: string[] }): void;
};

type EventContext = {
  request: Request;
  env: { SEO_EVENTS?: AnalyticsEngineDataset };
};

function jsonResponse(body: object, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function isSameSiteRequest(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === requestOrigin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

function analyticsBlobs(payload: AnalyticsPayload) {
  return [payload.event, payload.page ?? "", payload.device ?? ""];
}

export async function onRequest({ request, env }: EventContext) {
  if (request.method === "GET") {
    return env.SEO_EVENTS
      ? jsonResponse({ ok: true, status: "ready" }, 200)
      : jsonResponse(
          { ok: false, status: "analytics_unavailable" },
          503,
        );
  }
  if (request.method !== "POST") {
    return jsonResponse({ ok: false }, 405);
  }
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  if (contentType?.trim().toLowerCase() !== "application/json") {
    return jsonResponse({ ok: false }, 415);
  }
  if (!isSameSiteRequest(request)) {
    return jsonResponse({ ok: false }, 403);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_PAYLOAD_BYTES
  ) {
    return jsonResponse({ ok: false }, 400);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return jsonResponse({ ok: false }, 400);
  }
  if (new TextEncoder().encode(body).byteLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ ok: false }, 400);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return jsonResponse({ ok: false }, 400);
  }
  const validation = validateAnalyticsPayload(parsed);
  if (!validation.ok) return jsonResponse({ ok: false }, 400);
  if (!env.SEO_EVENTS) {
    return jsonResponse(
      { ok: false, status: "analytics_unavailable" },
      503,
    );
  }

  try {
    env.SEO_EVENTS.writeDataPoint({ blobs: analyticsBlobs(validation.value) });
  } catch {
    return jsonResponse(
      { ok: false, status: "analytics_unavailable" },
      503,
    );
  }
  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
