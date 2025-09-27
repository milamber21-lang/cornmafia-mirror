// FILE: apps/web/src/app/me/page.tsx
import Image from "next/image";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import LoginClient from "@/components/login/LoginClient";
import RolesPanel from "@/components/login/RolesPanel";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await getServerSession(buildAuthOptions());

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p>You are not signed in.</p>
        <LoginClient session={null} />
      </main>
    );
  }

  const name = session.user.name ?? "User";
  const img = session.user.image ?? null;

  return (
    <section className="card">
      <header className="flex items-center gap-4">
        {img ? (
          <Image
            src={img}
            alt={name}
            width={80}
            height={80}
            unoptimized
            className="rounded-full ring-1 ring-[var(--color-border)]"
            style={{ width: 80, height: 80, objectFit: "cover" }}
          />
        ) : (
          <div
            className="rounded-full ring-1 ring-[var(--color-border)] grid place-items-center text-lg"
            style={{ width: 80, height: 80, background: "var(--color-surface)" }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
        </div>
      </header>

      <RolesPanel />
    </section>
  );
}
