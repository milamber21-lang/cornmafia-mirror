// FILE: apps/web/src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
      <div className="muted">© {new Date().getFullYear()} Corn Mafia. All rights reserved.</div>
      <nav style={{ display: "flex", gap: 16 }}>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </div>
  );
}
