// FILE: apps/web/src/app/api/me/route.ts
import { NextResponse } from "next/server";

/**
 * This endpoint is deprecated. The cm-bot service has been removed.
 * Use /api/me/roles instead.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint removed. Use /api/me/roles." },
    { status: 410 },
  );
}
