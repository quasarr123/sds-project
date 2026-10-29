/** Shared helpers for the live-API test scripts (they need the server running). */
export const BASE = process.env.TEST_BASE ?? `http://localhost:${process.env.API_PORT ?? 3001}/api`;
const PASSWORD = process.env.DEMO_PASSWORD ?? "Coep@1234";

let pass = 0, failN = 0;
export function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${ok ? "" : "  → " + extra}`);
  ok ? pass++ : failN++;
}

/** Prints the totals and exits with a non-zero code if any check failed. */
export function finish() {
  console.log(`\n${pass} passed, ${failN} failed`);
  process.exit(failN ? 1 : 0);
}

/** Logs in and returns a function that calls the API as that user. */
export async function login(email: string) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`login failed for ${email}: ${r.status}`);
  const sid = /sid=([^;]+)/.exec(r.headers.get("set-cookie") ?? "")?.[1];
  return async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${BASE}${path}`, {
      method, headers: { "Content-Type": "application/json", Cookie: `sid=${sid}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, data: (await res.json().catch(() => ({}))) as any };
  };
}
export type Api = Awaited<ReturnType<typeof login>>;

/** 'YYYY-MM-DD' for today + n days on the campus (IST) clock. */
export const day = (n: number) => new Date(Date.now() + n * 86400000 + 5.5 * 3600000).toISOString().slice(0, 10);
