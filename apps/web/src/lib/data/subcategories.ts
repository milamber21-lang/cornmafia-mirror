//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/subcategories.ts                                                                  ////
//// Language: TS                                                                                                  ////
//// DB-first admin subcategory read helpers with effective policy fields                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";

type SubcategoryAdminDbRow = {
  subcategory_id: number | string;
  category_id: number | string;
  category_title: string;
  category_slug: string;
  category_read_policy_code: "public" | "min_rank" | "equal_rank";
  category_read_rank: number | null;
  category_write_policy_code: "min_rank" | "equal_rank";
  category_write_rank: number;
  category_nav_hidden: boolean;
  title: string;
  slug: string;
  read_policy_code: "inherit" | "public" | "min_rank" | "equal_rank";
  read_rank: number | null;
  read_effective_policy_code: "public" | "min_rank" | "equal_rank";
  read_effective_rank: number | null;
  write_policy_code: "inherit" | "min_rank" | "equal_rank";
  write_rank: number | null;
  write_effective_policy_code: "min_rank" | "equal_rank";
  write_effective_rank: number;
  nav_hidden_mode_code: "inherit" | "explicit";
  nav_hidden: boolean | null;
  nav_hidden_effective: boolean;
  icon_key_id: number | string;
  icon_key_key: string;
  icon_key_label: string;
  icon_key_source_code: "lucide" | "media";
  icon_key_lucide_name: string | null;
  icon_media_id: number | string | null;
  icon_media_storage_rel_path: string | null;
  icon_media_filename: string | null;
  icon_media_original_filename: string | null;
  icon_media_mime_type: string | null;
  icon_color_id: number | string;
  icon_color_key: string;
  icon_color_label: string;
  icon_color_preview: string;
  template_ids: Array<number | string> | null;
  created_dt: string | Date;
  updated_dt: string | Date;
};

export type SubcategoryAdminItem = {
  id: string;
  title: string;
  slug: string;
  readPolicy: "inherit" | "public" | "rank_at_least" | "rank_equal";
  readMinRank: number | null;
  readEffectivePolicy: "public" | "rank_at_least" | "rank_equal";
  readEffectiveMinRank: number | null;
  writePolicy: "inherit" | "rank_at_least" | "rank_equal";
  writeMinRank: number | null;
  writeEffectivePolicy: "rank_at_least" | "rank_equal";
  writeEffectiveMinRank: number;
  navHiddenMode: "inherit" | "explicit_visible" | "explicit_hidden";
  navHidden: boolean;
  navHiddenEffective: boolean;
  allowedTemplates: string[];
  category: {
    id: string;
    title: string;
    slug: string;
    readPolicy: "public" | "rank_at_least" | "rank_equal";
    readMinRank: number | null;
    writePolicy: "rank_at_least" | "rank_equal";
    writeMinRank: number;
    navHidden: boolean;
  };
  iconKey: {
    id: string;
    key: string;
    label: string;
    source: "lucide" | "media";
    lucideName: string | null;
    iconMedia: {
      id: string;
      url: string | null;
      filename: string | null;
      originalFilename: string | null;
      mimeType: string | null;
      storageRelPath: string | null;
    } | null;
  } | null;
  iconColor: {
    id: string;
    key: string;
    label: string;
    preview: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapPolicy(value: "public" | "min_rank" | "equal_rank"): "public" | "rank_at_least" | "rank_equal" {
  return value === "equal_rank" ? "rank_equal" : value === "min_rank" ? "rank_at_least" : "public";
}

function mapWritePolicy(value: "min_rank" | "equal_rank"): "rank_at_least" | "rank_equal" {
  return value === "equal_rank" ? "rank_equal" : "rank_at_least";
}

function mapExplicitPolicy(value: "inherit" | "public" | "min_rank" | "equal_rank"): "inherit" | "public" | "rank_at_least" | "rank_equal" {
  if (value === "inherit") {
    return "inherit";
  }

  return mapPolicy(value);
}

function mapExplicitWritePolicy(value: "inherit" | "min_rank" | "equal_rank"): "inherit" | "rank_at_least" | "rank_equal" {
  if (value === "inherit") {
    return "inherit";
  }

  return mapWritePolicy(value);
}

function mapSubcategoryRow(row: SubcategoryAdminDbRow): SubcategoryAdminItem {
  return {
    id: String(row.subcategory_id),
    title: row.title,
    slug: row.slug,
    readPolicy: mapExplicitPolicy(row.read_policy_code),
    readMinRank: row.read_rank,
    readEffectivePolicy: mapPolicy(row.read_effective_policy_code),
    readEffectiveMinRank: row.read_effective_rank,
    writePolicy: mapExplicitWritePolicy(row.write_policy_code),
    writeMinRank: row.write_rank,
    writeEffectivePolicy: mapWritePolicy(row.write_effective_policy_code),
    writeEffectiveMinRank: row.write_effective_rank,
    navHiddenMode:
      row.nav_hidden_mode_code === "inherit"
        ? "inherit"
        : row.nav_hidden === true
          ? "explicit_hidden"
          : "explicit_visible",
    navHidden: row.nav_hidden ?? row.nav_hidden_effective,
    navHiddenEffective: row.nav_hidden_effective,
    allowedTemplates: Array.isArray(row.template_ids) ? row.template_ids.map((value) => String(value)) : [],
    category: {
      id: String(row.category_id),
      title: row.category_title,
      slug: row.category_slug,
      readPolicy: mapPolicy(row.category_read_policy_code),
      readMinRank: row.category_read_rank,
      writePolicy: mapWritePolicy(row.category_write_policy_code),
      writeMinRank: row.category_write_rank,
      navHidden: row.category_nav_hidden,
    },
    iconKey: row.icon_key_id == null
      ? null
      : {
          id: String(row.icon_key_id),
          key: row.icon_key_key,
          label: row.icon_key_label,
          source: row.icon_key_source_code,
          lucideName: row.icon_key_lucide_name,
          iconMedia: row.icon_media_id == null
            ? null
            : {
                id: String(row.icon_media_id),
                url: row.icon_media_storage_rel_path ? buildAdminMediaFileUrl(row.icon_media_storage_rel_path) : null,
                filename: row.icon_media_filename,
                originalFilename: row.icon_media_original_filename,
                mimeType: row.icon_media_mime_type,
                storageRelPath: row.icon_media_storage_rel_path,
              },
        },
    iconColor: row.icon_color_id == null
      ? null
      : {
          id: String(row.icon_color_id),
          key: row.icon_color_key,
          label: row.icon_color_label,
          preview: row.icon_color_preview,
        },
    createdAt: toIsoString(row.created_dt),
    updatedAt: toIsoString(row.updated_dt),
  };
}

export async function listSubcategoriesAdmin(): Promise<SubcategoryAdminItem[]> {
  const result = await query<SubcategoryAdminDbRow>(
    `
      SELECT
        subcategory_id,
        category_id,
        category_title,
        category_slug,
        category_read_policy_code,
        category_read_rank,
        category_write_policy_code,
        category_write_rank,
        category_nav_hidden,
        title,
        slug,
        read_policy_code,
        read_rank,
        read_effective_policy_code,
        read_effective_rank,
        write_policy_code,
        write_rank,
        write_effective_policy_code,
        write_effective_rank,
        nav_hidden_mode_code,
        nav_hidden,
        nav_hidden_effective,
        icon_key_id,
        icon_key_key,
        icon_key_label,
        icon_key_source_code,
        icon_key_lucide_name,
        icon_media_id,
        icon_media_storage_rel_path,
        icon_media_filename,
        icon_media_original_filename,
        icon_media_mime_type,
        icon_color_id,
        icon_color_key,
        icon_color_label,
        icon_color_preview,
        template_ids,
        created_dt,
        updated_dt
      FROM web_view.web_subcategories_admin
      ORDER BY category_title ASC, title ASC, subcategory_id ASC
    `,
  );

  return result.rows.map(mapSubcategoryRow);
}
