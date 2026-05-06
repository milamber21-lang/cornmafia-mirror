//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/icons.ts                                                                          ////
//// Language: TS                                                                                                  ////
//// DB-first admin icon read helpers                                                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";
import type { IconMediaRef, IconShape } from "@/lib/helpers/icons";

export type IconAdminDbRow = {
  icon_id: number | string;
  key: string;
  label: string;
  source_code: "lucide" | "media";
  lucide_name: string | null;
  media_id: number | string | null;
  media_storage_rel_path: string | null;
  media_filename: string | null;
  media_original_filename: string | null;
  media_mime_type: string | null;
  is_enabled: boolean;
  created_dt: string | Date;
  updated_dt: string | Date;
};

export type IconAdminItem = IconShape & {
  createdAt: string;
  updatedAt: string;
};

export type IconLookupItem = IconShape;

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapMedia(row: IconAdminDbRow): IconMediaRef | null {
  if (row.media_id == null) {
    return null;
  }

  const storageRelPath = row.media_storage_rel_path ?? null;

  return {
    id: String(row.media_id),
    url: storageRelPath ? buildAdminMediaFileUrl(storageRelPath) : null,
    filename: row.media_filename ?? null,
    originalFilename: row.media_original_filename ?? null,
    mimeType: row.media_mime_type ?? null,
    storageRelPath,
  };
}

function mapIconRow(row: IconAdminDbRow): IconAdminItem {
  return {
    id: String(row.icon_id),
    key: row.key,
    label: row.label,
    source: row.source_code,
    lucideName: row.lucide_name,
    iconMedia: mapMedia(row),
    enabled: row.is_enabled,
    createdAt: toIsoString(row.created_dt),
    updatedAt: toIsoString(row.updated_dt),
  };
}

function mapLookupRow(row: IconAdminDbRow): IconLookupItem {
  return {
    id: String(row.icon_id),
    key: row.key,
    label: row.label,
    source: row.source_code,
    lucideName: row.lucide_name,
    iconMedia: mapMedia(row),
    enabled: row.is_enabled,
  };
}

export async function listIconsAdmin(): Promise<IconAdminItem[]> {
  const result = await query<IconAdminDbRow>(
    `
      SELECT
        icon_id,
        key,
        label,
        source_code,
        lucide_name,
        media_id,
        media_storage_rel_path,
        media_filename,
        media_original_filename,
        media_mime_type,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_icons_admin
      ORDER BY key ASC, icon_id ASC
    `,
  );

  return result.rows.map(mapIconRow);
}

export async function findIconAdminById(iconId: number): Promise<IconAdminItem | null> {
  const result = await query<IconAdminDbRow>(
    `
      SELECT
        icon_id,
        key,
        label,
        source_code,
        lucide_name,
        media_id,
        media_storage_rel_path,
        media_filename,
        media_original_filename,
        media_mime_type,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_icons_admin
      WHERE icon_id = $1
      LIMIT 1
    `,
    [iconId],
  );

  const row = result.rows[0];
  return row ? mapIconRow(row) : null;
}

export async function listEnabledIconOptions(): Promise<IconLookupItem[]> {
  const result = await query<IconAdminDbRow>(
    `
      SELECT
        icon_id,
        key,
        label,
        source_code,
        lucide_name,
        media_id,
        media_storage_rel_path,
        media_filename,
        media_original_filename,
        media_mime_type,
        is_enabled,
        CURRENT_TIMESTAMP AS created_dt,
        CURRENT_TIMESTAMP AS updated_dt
      FROM web_view.web_icons_lookup
      WHERE is_enabled = true
      ORDER BY key ASC, icon_id ASC
    `,
  );

  return result.rows.map(mapLookupRow);
}
