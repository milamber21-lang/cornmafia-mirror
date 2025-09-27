// FILE: apps/cms/src/app/api/debug/echo/route.ts
// Language: TypeScript

export const runtime = "nodejs";

function readSearch(urlStr: unknown): Record<string, string> {
  if (typeof urlStr !== "string") return {};
  const u = new URL(urlStr, "http://dummy.local");
  const out: Record<string, string> = {};
  for (const [k, v] of u.searchParams.entries()) out[k] = v;
  return out;
}

export async function POST(req: Request) {
  const urlStr = (req as unknown as { url?: string }).url ?? null;
  const query = readSearch(urlStr);
  const headersIn: Record<string, unknown> = {};
  for (const [k, v] of (req.headers as unknown as Headers).entries()) headersIn[k] = v;

  const ct = (req.headers.get("content-type") || "").toLowerCase();
  let bodyInfo: Record<string, unknown> = { mode: "unknown" };

  try {
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const keys: string[] = [];
      form.forEach((_v, k) => keys.push(k));
      bodyInfo = {
        mode: "form-data",
        keys,
        hasFile: keys.includes("file"),
        fileName:
          (form.get("file") instanceof File && (form.get("file") as File).name) || null,
        dataRaw: form.get("data") ?? null,
      };
    } else if (ct.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      bodyInfo = { mode: "json", keys: Object.keys(json as Record<string, unknown>) };
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      bodyInfo = { mode: "urlencoded", length: text.length };
    } else {
      const text = await req.text();
      bodyInfo = { mode: "text", length: text.length };
    }
  } catch (e) {
    bodyInfo = { mode: "error", error: (e as Error)?.message ?? "parse failed" };
  }

  return new Response(
    JSON.stringify(
      {
        ok: true,
        url: urlStr,
        query,
        headers: headersIn,
        body: bodyInfo,
      },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
