// FILE: apps/web/src/components/blocks/RichText.tsx
// Reusable Lexical -> React renderer, consuming the VM shape.

import type { LexicalNode, LexicalRoot } from "@/lib/cms-translate";
import React from "react";

function renderInline(node: LexicalNode): React.ReactNode {
  if (node.type === "text") {
    let el: React.ReactNode = node.text ?? "";
    const fmt = node.format ?? 0;
    if (fmt & 1) el = <strong>{el}</strong>;
    if (fmt & 2) el = <em>{el}</em>;
    if (fmt & 4) el = <u>{el}</u>;
    if (fmt & 8) el = <s>{el}</s>;
    if (fmt & 16) el = <code>{el}</code>;
    if (fmt & 32) el = <sub>{el}</sub>;
    if (fmt & 64) el = <sup>{el}</sup>;
    return el;
  }
  if (node.type === "link") {
    const href = node.fields?.url ?? "#";
    const newTab = !!node.fields?.newTab;
    return (
      <a href={href} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined}>
        {(node.children ?? []).map((c, i) => (
          <span key={i}>{renderInline(c)}</span>
        ))}
      </a>
    );
  }
  return (node.children ?? []).map((c, i) => <span key={i}>{renderInline(c)}</span>);
}

function renderBlock(node: LexicalNode, key?: React.Key): React.ReactNode {
  switch (node.type) {
    case "root":
      return <>{(node.children ?? []).map((c, i) => <div key={i}>{renderBlock(c, i)}</div>)}</>;
    case "paragraph":
      return <p key={key}>{(node.children ?? []).map((c, i) => <span key={i}>{renderInline(c)}</span>)}</p>;
    case "horizontalrule":
      return <hr key={key} />;
    case "heading": {
      const tag = (node.tag || "h2").toLowerCase();
      const allowed = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
      const isAllowed = (allowed as readonly string[]).includes(tag);
      const Tag: React.ElementType = isAllowed ? (tag as React.ElementType) : "h2";
      return React.createElement(
        Tag,
        { key },
        (node.children ?? []).map((c, i) => <span key={i}>{renderInline(c)}</span>)
      );
    }
    case "list": {
      const isBullet = (node.listType ?? node.tag) === "bullet" || node.tag === "ul";
      const ListEl: React.ElementType = isBullet ? "ul" : "ol";
      return <ListEl key={key}>{(node.children ?? []).map((li, i) => renderBlock(li, i))}</ListEl>;
    }
    case "listitem":
      return <li key={key}>{(node.children ?? []).map((c, i) => <span key={i}>{renderInline(c)}</span>)}</li>;
    default:
      return <div key={key}>{(node.children ?? []).map((c, i) => <span key={i}>{renderInline(c)}</span>)}</div>;
  }
}

export default function RichText({ value }: { value: LexicalRoot }) {
  if (!value?.root) return null;
  return <>{renderBlock(value.root)}</>;
}
