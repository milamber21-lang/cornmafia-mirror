// apps/web/src/app/login/page.tsx
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import LoginClient from "./LoginClient";

// don't pre-render at build (needs live session)
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(buildAuthOptions());
  return <LoginClient session={session} />;
}
