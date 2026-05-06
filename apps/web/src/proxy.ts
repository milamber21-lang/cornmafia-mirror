//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/proxy.ts                                                                                ////
//// Language: TS                                                                                               ////
//// Central API proxy guard that rejects explicit cross-site mutation attempts before route logic runs.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse, type NextRequest } from "next/server";

import { assertSameOriginMutation } from "@/lib/server/mutation-origin";

export function proxy(request: NextRequest): NextResponse {
	const sameOriginResponse = assertSameOriginMutation(request);
	return sameOriginResponse ?? NextResponse.next();
}

export const config = {
	matcher: "/api/:path*",
};
