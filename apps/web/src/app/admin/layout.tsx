// FILE: apps/web/src/app/admin/layout.tsx
/**
 * Guard ALL /admin/* routes.
 * - Allows Admins OR Editors (cmsAdmin || fullEditorialAccess)
 * - Non-authorized users see site 404 (security by concealment)
 */
import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireAdminOrEditor } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { allowed } = await requireAdminOrEditor(new Request("http://local"));
  if (!allowed) return notFound();
  return <>{children}</>;
}
