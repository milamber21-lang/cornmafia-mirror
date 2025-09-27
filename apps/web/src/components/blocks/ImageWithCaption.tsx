// FILE: apps/web/src/components/blocks/ImageWithCaption.tsx
import type { Media } from "@/lib/cms-translate";
import type { LexicalRoot } from "@/lib/cms-translate";
import RichText from "./RichText";
import Image from "next/image";

export default function ImageWithCaption({
  media,
  alt,
  caption,
}: {
  media?: Media | null;
  alt?: string | null;
  caption?: LexicalRoot | null;
}) {
  if (!media?.url) return null;
  return (
    <figure style={{ margin: "16px 0" }}>
      <Image
        src={media.url}
        alt={alt ?? media.alt ?? ""}
        width={media.width || 1200}
        height={media.height || 800}
        style={{ width: "100%", height: "auto" }}
      />
      {caption && (
        <figcaption className="muted" style={{ marginTop: 6 }}>
          <RichText value={caption} />
        </figcaption>
      )}
    </figure>
  );
}
