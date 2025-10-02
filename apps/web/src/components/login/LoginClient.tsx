// FILE: apps/web/src/components/login/LoginClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { Button, ButtonLink } from "@/components/ui";

function isHttpUrl(u: string | null | undefined) {
  if (!u || typeof u !== "string") return false;
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; } catch { return false; }
}

function SignedOutButton() {
  return (
    <Button
      size="md"
      variant="accent"
      onClick={() => signIn("discord", { callbackUrl: "/" })}
      aria-label="Log-in with Discord"
    >
      Log-in Discord
    </Button>
  );
}

function initials(name?: string | null) {
  if (!name) return "U";
  const p = name.trim().split(/\s+/);
  const a = p[0]?.[0] ?? ""; const b = p.length > 1 ? p[p.length - 1][0] : "";
  return (a + b || a).toUpperCase();
}

function SignedInMenu({ name, image, isCmsAdmin }: { name: string; image: string | null; isCmsAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!popRef.current) return; if (!popRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const avatarSrc = isHttpUrl(image) ? image! : null;

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="group flex items-center justify-center"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
        style={{ width: "var(--avatar-size)", height: "var(--avatar-size)", borderRadius: "999px", cursor: "pointer" }}
      >
        <div className="relative">
          {avatarSrc && imgOk ? (
            <Image
              src={avatarSrc}
              alt={name}
              width={256}
              height={256}
              unoptimized
              onError={() => setImgOk(false)}
              referrerPolicy="no-referrer"
              className="avatar-img"
              style={{ width: "var(--avatar-size)", height: "var(--avatar-size)", objectFit: "cover" }}
              priority={false}
            />
          ) : (
            <div
              className="avatar-img"
              style={{ width: "var(--avatar-size)", height: "var(--avatar-size)", background: "var(--color-surface)" }}
            >
              <span className="text-sm opacity-80">{initials(name)}</span>
            </div>
          )}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="header-avatar-panel"
          style={{ zIndex: 30 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="grid gap-2">
            <ButtonLink size="sm" variant="neutral" href="/me" block onClick={() => setOpen(false)}>
              Profile
            </ButtonLink>

            {isCmsAdmin ? (
              <ButtonLink size="sm" variant="neutral" href="/admin" block onClick={() => setOpen(false)}>
                Admin
              </ButtonLink>
            ) : null}

            <Button size="sm" variant="accent" block onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}>
              Log-out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginClient({ session, isCmsAdmin }: { session: Session | null; isCmsAdmin?: boolean }) {
  const user = session?.user;
  if (!user) return <SignedOutButton />;
  return <SignedInMenu name={user.name ?? "User"} image={user.image ?? null} isCmsAdmin={isCmsAdmin} />;
}
