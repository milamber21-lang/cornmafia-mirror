// FILE: apps/web/src/components/blocks/MediaText.tsx
import type { Media } from "@/lib/cms-translate";
import type { LexicalRoot } from "@/lib/cms-translate";
import RichText from "./RichText";
import Image from "next/image";

export default function MediaText({
  media,
  alt,
  caption,
  position = "right",
  widthPct = 40,
  body,
}: {
  media?: Media | null;
  alt?: string | null;
  caption?: string | null;
  position?: "left" | "right" | "center";
  widthPct?: number;
  body?: LexicalRoot | null;
}) {
  const pos = position;
  const width = Math.max(10, Math.min(90, widthPct));

  return (
    <div
      className={`media-text ${pos}`}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        ...(pos === "center" ? { flexDirection: "column", alignItems: "center" } : undefined),
      }}
    >
      {media?.url && (pos === "left" || pos === "center") && (
        <figure style={{ flex: `0 0 ${pos === "center" ? "auto" : `${width}%`}`, maxWidth: "100%" }}>
          <Image
            src={media.url}
            alt={alt ?? media.alt ?? ""}
            width={media.width || 800}
            height={media.height || 600}
            style={{ width: "100%", height: "auto" }}
          />
          {caption && <figcaption className="muted" style={{ marginTop: 6 }}>{caption}</figcaption>}
        </figure>
      )}

      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {body && <RichText value={body} />}
      </div>

      {media?.url && pos === "right" && (
        <figure style={{ flex: `0 0 ${width}%`, maxWidth: "100%" }}>
          <Image
            src={media.url}
            alt={alt ?? media.alt ?? ""}
            width={media.width || 800}
            height={media.height || 600}
            style={{ width: "100%", height: "auto" }}
          />
          {caption && <figcaption className="muted" style={{ marginTop: 6 }}>{caption}</figcaption>}
        </figure>
      )}
    </div>
  );
}
