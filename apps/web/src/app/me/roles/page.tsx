// FILE: apps/web/src/app/me/roles/page.tsx
import { getServerSession } from "next-auth";
import Link from "next/link";
import { buildAuthOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

type APIRole = {
  id: string;
  name: string;
  position: number;
  color: number;
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  permissions: string;
  icon?: string | null;
  unicode_emoji?: string | null;
  tags?: Record<string, unknown>;
  flags?: number;
};

type APIGuildMember = {
  user?: { id: string; username: string; global_name?: string | null; avatar?: string | null };
  nick?: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf?: boolean;
  mute?: boolean;
  flags?: number;
  pending?: boolean;
  communication_disabled_until?: string | null;
};

async function discordGet<T>(path: string): Promise<T> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set for cm-web");
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: "no-store",
  } as RequestInit); // keep RequestInit explicit to avoid TS complaints
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord GET ${path} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export default async function Page() {
  const session = await getServerSession(buildAuthOptions());
  if (!session?.user) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Discord roles (raw)</h1>
        <p>
          You’re not signed in.{" "}
          <Link className="underline" href="/login">Sign in</Link> first.
        </p>
      </main>
    );
  }

  const discordId = (session.user as { discordId?: string | null }).discordId ?? null;
  const guildId = process.env.DISCORD_GUILD_ID ?? null;

  if (!discordId || !guildId) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Discord roles (raw)</h1>
        <p>
          Missing info:&nbsp;
          {!discordId && <span>session.user.discordId, </span>}
          {!guildId && <span>DISCORD_GUILD_ID</span>}
        </p>
      </main>
    );
  }

  let member: APIGuildMember | null = null;
  let allRoles: APIRole[] = [];

  try {
    member = await discordGet<APIGuildMember>(`/guilds/${guildId}/members/${discordId}`);
  } catch {
    member = null;
  }

  try {
    allRoles = await discordGet<APIRole[]>(`/guilds/${guildId}/roles`);
  } catch (e) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Discord roles (raw)</h1>
        <p className="text-red-600">Failed to fetch guild roles: {(e as Error).message}</p>
      </main>
    );
  }

  const rolesById = new Map(allRoles.map((r) => [r.id, r]));
  const userRoleIds = member?.roles ?? [];
  const userRolesDetailed = userRoleIds
    .map((id) => rolesById.get(id))
    .filter((r): r is APIRole => Boolean(r))
    .sort((a, b) => b.position - a.position);

  const missingRoleIds = userRoleIds.filter((id) => !rolesById.has(id));

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Discord roles (raw)</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Who</h2>
        <p>
          <strong>Discord ID:</strong> {discordId}
          <br />
          <strong>Guild ID:</strong> {guildId}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Member object from Discord</h2>
        {member ? (
          <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
            {JSON.stringify(member, null, 2)}
          </pre>
        ) : (
          <p className="text-amber-600">
            Could not fetch member. Possible reasons: the bot isn’t in the guild, missing
            <code> GUILD_MEMBERS </code> intent, wrong <code>DISCORD_GUILD_ID</code>, or you’re not in the guild.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Your assigned roles (detailed)</h2>
        {userRolesDetailed.length ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Position</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Color</th>
                <th className="text-left p-2">Hoist</th>
                <th className="text-left p-2">Managed</th>
                <th className="text-left p-2">Mentionable</th>
              </tr>
            </thead>
            <tbody>
              {userRolesDetailed.map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="p-2">{r.position}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">#{r.color.toString(16).padStart(6, "0")}</td>
                  <td className="p-2">{String(r.hoist)}</td>
                  <td className="p-2">{String(r.managed)}</td>
                  <td className="p-2">{String(r.mentionable)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No roles on member (or member unavailable).</p>
        )}
        {missingRoleIds.length > 0 && (
          <p className="text-amber-600 mt-2">
            Missing role details for IDs: {missingRoleIds.join(", ")}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">All guild roles ({allRoles.length})</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Position</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Color</th>
              <th className="text-left p-2">Hoist</th>
              <th className="text-left p-2">Managed</th>
              <th className="text-left p-2">Mentionable</th>
              <th className="text-left p-2">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {allRoles
              .slice()
              .sort((a, b) => b.position - a.position)
              .map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="p-2">{r.position}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">#{r.color.toString(16).padStart(6, "0")}</td>
                  <td className="p-2">{String(r.hoist)}</td>
                  <td className="p-2">{String(r.managed)}</td>
                  <td className="p-2">{String(r.mentionable)}</td>
                  <td className="p-2">{r.permissions}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
