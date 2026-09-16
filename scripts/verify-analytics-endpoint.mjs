const origin = new URL(
  process.argv[2] ??
    process.env.ANALYTICS_SMOKE_ORIGIN ??
    "https://codereset.dev",
);
const endpoint = new URL("/api/events", origin);

async function responseDetail(response) {
  const body = await response.text();
  return `${response.status} ${response.statusText}${body ? `: ${body}` : ""}`;
}

const health = await fetch(endpoint, {
  headers: { accept: "application/json" },
});
if (health.status !== 200) {
  throw new Error(`Analytics binding is not ready (${await responseDetail(health)})`);
}
const healthBody = await health.json();
if (healthBody?.status !== "ready") {
  throw new Error(`Unexpected analytics health response: ${JSON.stringify(healthBody)}`);
}

const rejected = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: origin.origin,
  },
  body: JSON.stringify({
    event: "analytics_probe",
    resetAt: "not-allowed",
  }),
});
if (rejected.status !== 400) {
  throw new Error(
    `Privacy rejection check failed (${await responseDetail(rejected)})`,
  );
}

const write = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: origin.origin,
  },
  body: JSON.stringify({ event: "analytics_probe" }),
});
if (write.status !== 204) {
  throw new Error(`Analytics write failed (${await responseDetail(write)})`);
}

console.log(`Analytics binding, privacy rejection, and write passed at ${endpoint}`);
