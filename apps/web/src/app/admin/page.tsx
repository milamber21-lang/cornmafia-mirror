// FILE: apps/web/src/app/admin/page.tsx
import { Table, THead, TBody, TR, TH, TD, ButtonLink } from "@/components/ui";

type Row = {
  page: string;
  comment: string;
  href: string;
};

const rows: Row[] = [
  {
    page: "Land plots",
    href: "/admin/land-plots/1",
    comment:
      "Shows claims on specific land plots. Crossed are those that are claims that are already placed. Due to the lag between getting data into the DB it is cca 90% acurate",
  },
  {
    page: "Claim checker",
    href: "/admin/land-plots/check-claim",
    comment:
      "Search for NFT Id, it will show if it was sucesfull and on what plot or if it is still active. And if so what in what locations",
  },  
  {
    page: "Land placement overview",
    href: "/admin/land-plots/overview/",
    comment:
      "I hope that soon will be able to show basic table for each Sector, District, Town",
  },  
  {
    page: "Media",
    href: "/admin/media?p=1",
    comment:
      "Upload files used across the site. The allowed file types are limited for now, but we’ll support things like custom icons later.",
  },
  {
    page: "Theme tokens",
    href: "/admin/theme-tokens?p=1",
    comment:
      "Theme colors. Currently used for icon colors. Accepts hex values (e.g., #rrggbb) or CSS variables from globals.css (pre-filled).",
  },
  {
    page: "Icons",
    href: "/admin/icons",
    comment:
      "Icons from Lucide or custom uploads. Used in categories, subcategories, and pages.",
  },
  {
    page: "Categories",
    href: "/admin/categories",
    comment:
      "Top-level sections of the site (e.g., Guild, Learn). Each category contains subcategories; subcategories contain pages. Categories appear in the main menu.",
  },
  {
    page: "Subcategories",
    href: "/admin/subcategories",
    comment:
      "Buckets under categories that contain pages. These render as columns in the menu.",
  },
  {
    page: "Nav",
    href: "/admin/nav",
    comment:
      "Each category can have up to 4 subcategories, and each subcategory can list up to 5 pages.",
  },
  {
    page: "Footer",
    href: "/admin/footer",
    comment: "Manage footer links and basic footer elements.",
  },
  {
    page: "Discord Roles",
    href: "/admin/discord-roles",
    comment:
      "Define Discord roles used on the server and map permissions alongside categories and subcategories.",
  },
  {
    page: "Series",
    href: "/admin/series",
    comment:
      "Group related pages across the site (e.g., learning, YouTube, game series). Requires category, subcategory, and author.",
  },
  {
    page: "Templates",
    href: "/admin/templates",
    comment:
      "Define page layouts. Currently only “page”; we’ll add YouTube, tutorials, and others later.",
  },
  {
    page: "Pages",
    href: "/admin/pages",
    comment:
      "List and manage pages — the core content of the site. Pages live under subcategories and can use templates.",
  },
];

export default function AdminIndex() {
  return (
    <section className="card space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to Admin page</h1>

      <p className="text-[var(--color-muted)]">
        Be careful: on this page you can modify most of the guild website settings, and you may break or delete content.
      </p>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <Table className="min-w-full text-sm">
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "82%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>

          <THead>
            <TR>
              <TH className="text-center">Page</TH>
              <TH className="text-center">Comment</TH>
              <TH className="text-center">Action</TH>
            </TR>
          </THead>

          <TBody>
            {rows.map((r) => (
              <TR key={r.href}>
                <TD className="font-medium text-center">{r.page}</TD>
                <TD className="text-center">{r.comment}</TD>
                <TD className="text-center">
                  <ButtonLink href={r.href} variant="neutral">
                    Open
                  </ButtonLink>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </section>
  );
}
