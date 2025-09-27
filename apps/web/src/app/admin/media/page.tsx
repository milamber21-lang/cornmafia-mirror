// FILE: apps/web/src/app/admin/media/page.tsx
// Language: TSX
import Link from "next/link";
import { buildAuthOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { cmsAuthedFetchJsonForDiscordUser } from "@/lib/cms-authed";
import CategoryUserFilterBar from "@/components/ui/CategoryUserFilterBar";
import MediaTable from "@/components/admin/MediaTable";
import MediaPanel from "@/components/admin/MediaPanel";
import { ButtonLink } from "@/components/ui";

type Category = { id: string; name: string; label?: string; title?: string; slug?: string };
type Subcategory = { id: string; name: string; label?: string; title?: string; slug?: string; category: string };

function normalizeName(x: { name?: string; label?: string; title?: string; slug?: string; id: string }) {
  return x.name || x.label || x.title || x.slug || x.id;
}

async function fetchCategories(actorDiscordId: string): Promise<Array<{ id: string; name: string }>> {
  const qs = new URLSearchParams({ limit: "1000", depth: "0", sort: "name" }).toString();
  const data = await cmsAuthedFetchJsonForDiscordUser<{ docs: Category[] }>(
    actorDiscordId,
    `/api/categories?${qs}`,
    { method: "GET" },
  );
  return (data?.docs ?? []).map((d) => ({ id: d.id, name: normalizeName(d) }));
}

async function fetchSubcategories(actorDiscordId: string): Promise<Array<{ id: string; name: string; category: string }>> {
  const qs = new URLSearchParams({ limit: "2000", depth: "0", sort: "name" }).toString();
  const data = await cmsAuthedFetchJsonForDiscordUser<{ docs: Subcategory[] }>(
    actorDiscordId,
    `/api/subcategories?${qs}`,
    { method: "GET" },
  );
  return (data?.docs ?? []).map((d) => ({ id: d.id, name: normalizeName(d), category: d.category }));
}

export default async function MediaAdminPage() {
  const session = await getServerSession(buildAuthOptions());
  const actorDiscordId = (session?.user as { discordId?: string | null } | undefined)?.discordId ?? null;

  if (!actorDiscordId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Media Files</h1>
        <p className="mb-4">You need to sign in to access the admin area.</p>
        <Link href="/login" className="underline">
          Go to login
        </Link>
      </div>
    );
  }

  const [categories, subcategoriesRaw] = await Promise.all([
    fetchCategories(actorDiscordId),
    fetchSubcategories(actorDiscordId),
  ]);

  // Adapt for the filter bar prop shape (categoryId)
  const subcategories = subcategoriesRaw.map((s) => ({ id: s.id, name: s.name, categoryId: s.category }));

  return (
    <section className="card">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-2xl font-semibold">Media Files</h1>
        <div className="flex items-center gap-2">
          <ButtonLink href="/admin" variant="neutral">Go back</ButtonLink>
        </div>
      </div>

      <div className="pb-6">
        <CategoryUserFilterBar
          categories={categories}
          subcategories={subcategories}
          showCategory
          showSubcategory
          showSearch
          showReset
          showUpload
          uploadHref="/admin/media?mediaPanel=upload"
          uploadLabel="Upload media"
          searchPlaceholder="Search username / alt / filename…"
        />
      </div>

      <MediaTable />
      <MediaPanel />
    </section>
  );
}
