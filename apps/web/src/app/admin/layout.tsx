//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/layout.tsx                                                                      ////
//// Language: TSX                                                                                                ////
//// Shared admin layout guard for admin and editor route entry                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX, ReactNode } from "react";
import { notFound } from "next/navigation";

import { requireAdminOrEditor } from "@/lib/auth/authz";

export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}): Promise<JSX.Element> {
	const guard = await requireAdminOrEditor();

	if (!guard.allowed) {
		return notFound();
	}

	return <>{children}</>;
}
