// FILE: apps/web/src/app/admin/themetokens/page.tsx
import { cookies } from "next/headers";
import { ButtonLink, Button } from "@/components/ui";
import ThemeTokensTable from "../../../components/admin/ThemeTokensTable";

type ThemeToken = {
  id: string;
  key: string;
  label: string;
  preview?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const dynamic = "force-dynamic";

async function getTokens(): Promise<ThemeToken[]> {
  // Forward cookies so the guarded proxy sees your session
  const cookie = cookies().toString();
  const base =
    process.env.WEB_INTERNAL_URL ||
    process.env.WEB_PUBLIC_URL ||
    "http://localhost:5323";
  const res = await fetch(`${base.replace(/\/$/, "")}/api/admin/theme-tokens`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!res.ok) throw new Error(`Failed to fetch theme tokens (${res.status})`);
  const data = (await res.json()) as { docs?: ThemeToken[] };
  return data.docs ?? [];
}

export default async function ThemeTokensAdminPage() {
  const tokens = await getTokens();

  // Build header actions as links so they work from the server component.
  // Create opens the side panel by adding ?create=1
  const createHref = "/admin/theme-tokens?create=1";

  return (
    <section className="card">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-2xl font-semibold">Theme Tokens</h1>
        <div className="flex items-center gap-2">
          <ButtonLink href="/admin" variant="neutral">
            Go back
          </ButtonLink>
        </div>
      </div>

      <ThemeTokensTable initialTokens={tokens} />
    </section>
  );
}
