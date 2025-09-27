// FILE: apps/web/src/components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { buildAuthOptions } from "@/lib/auth-options";
import LoginClient from "./login/LoginClient";
import { requireCmsAdmin } from "@/lib/authz";

export default async function Header() {
  const session = await getServerSession(buildAuthOptions());
  const signedIn = Boolean(session?.user);

  // Minimal: reuse server guard to compute admin status; no extra styling changes.
  const isCmsAdmin = signedIn
    ? (await requireCmsAdmin(new Request("http://local"))).allowed
    : false;

  return (
    <>
      <Link
        href="/"
        className="brand"
        style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
      >
        <Image
          src="/logos/mafia_logo.png"
          alt="Corn Mafia logo"
          width={68}
          height={68}
          priority
          style={{ height: "var(--header-logo-h)", width: "auto", objectFit: "contain" }}
        />
        <Image
          src="/logos/mafia_banner_header_transparent.png"
          alt="Corn Mafia"
          width={340}
          height={68}
          priority
          style={{ height: "var(--header-wordmark-h)", width: "auto", objectFit: "contain" }}
        />
      </Link>

      {/* Right-edge anchor used for BOTH states, so x-position is identical */}
      {!signedIn && (
        <div className="header-right">
          <LoginClient session={session} />
        </div>
      )}

      {signedIn && (
        <div className="header-avatar">
          <LoginClient session={session} isCmsAdmin={isCmsAdmin} />
        </div>
      )}
    </>
  );
}
