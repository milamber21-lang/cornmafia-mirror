// FILE: apps/web/src/components/MenuClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuModel } from "./Menu";
import { ChevronDown, Circle } from "lucide-react";
import * as Lucide from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

type Props = { model: MenuModel };

/** Render a lucide icon component by its PascalCase name, or a media icon by URL, with graceful fallback. */
function MenuIcon(props: { name?: string; url?: string; className?: string; size?: number }) {
  const { name, url, className, size = 16 } = props;

  // Media icon takes precedence if provided
  if (url) {
    // Use next/image to avoid Next.js LCP warnings
    return (
      <span className={`cm-icon ${className || ""}`} aria-hidden>
        <Image src={url} alt="" width={size} height={size} />
      </span>
    );
  }

  // Else lucide by dynamic name
  type LucideCmp = React.ComponentType<React.ComponentProps<typeof Circle>>;
  const lib = Lucide as unknown as Record<string, LucideCmp>;
  if (name && Object.prototype.hasOwnProperty.call(lib, name)) {
    const Cmp = lib[name];
    return <Cmp className={className} size={size} aria-hidden />;
  }

  return <Circle className={className} size={size} aria-hidden />;
}

export default function MenuClient({ model }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLElement | null>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [panelWidth, setPanelWidth] = useState(0);
  const hideTimer = useRef<number | null>(null);

  const clearHide = () => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } };
  const scheduleHide = () => { clearHide(); hideTimer.current = window.setTimeout(() => setOpenId(null), 130); };

  const current = useMemo(() => model.find(c => c.id === openId) || null, [model, openId]);

  const recomputePanelMetrics = useCallback((catId: string) => {
    const cont = containerRef.current;
    const anchorEl = btnRefs.current[catId];
    const item = model.find(c => c.id === catId);
    if (!cont || !anchorEl || !item) return;

    const cols = Math.min(4, Math.max(1, item.columns.length));
    const btnRect = anchorEl.getBoundingClientRect();
    const contRect = cont.getBoundingClientRect();

    const contentW = cols * 210 + (cols - 1) * 10;
    const boxW = contentW + 20 + 2;

    let left = Math.round(btnRect.left - contRect.left);
    const maxLeft = Math.max(0, contRect.width - boxW);
    if (left > maxLeft) left = maxLeft;
    if (left < 0) left = 0;

    setPanelWidth(boxW);
    setPanelLeft(left);
  }, [model]);

  const openFor = useCallback((catId: string) => {
    clearHide();
    recomputePanelMetrics(catId);
    setOpenId(catId);
  }, [recomputePanelMetrics]);

  useEffect(() => {
    const onResize = () => { if (openId) recomputePanelMetrics(openId); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [openId, recomputePanelMetrics]);

  function ensureMinPages<T extends { title: string; href: string; iconName?: string; iconUrl?: string }>(items: T[] | undefined, min = 4): T[] {
    const out: T[] = [...(items || [])];
    for (let i = out.length; i < min; i++) out.push({ title: `Demo Page ${i + 1}`, href: "#" } as T);
    return out;
  }

  return (
    <div ref={containerRef} className="menu-nav" onMouseLeave={scheduleHide} onMouseEnter={clearHide}>
      <div className="menu-row">
        {model.map(cat => (
          <div className="menu-item" key={cat.id}>
            <span ref={el => { btnRefs.current[cat.id] = el; }}>
              <Button
                size="lg"
                variant="ghost"
                onMouseEnter={() => openFor(cat.id)}
                onFocus={() => openFor(cat.id)}
                onClick={() => (openId === cat.id ? setOpenId(null) : openFor(cat.id))}
                rightIcon={<ChevronDown size={16} className="chev" aria-hidden />}
              >
                {cat.title}
              </Button>
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            className="menu-panel"
            style={{ left: panelLeft, width: panelWidth }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onMouseEnter={clearHide}
            onMouseLeave={scheduleHide}
          >
            <div
              className="menu-grid"
              style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, current.columns.length))}, 210px)` }}
            >
              {current.columns.map(col => {
                const pages = ensureMinPages(col.pages, 4);
                return (
                  <div className="menu-col" key={col.id}>
                    <a className="menu-col-title" href={col.seeAllHref}>
                      <MenuIcon name={col.iconName} url={col.iconUrl} />
                      <span>{col.title}</span>
                    </a>

                    {!!pages.length && (
                      <ul className="menu-links">
                        {pages.map(p => (
                          <li key={`${col.id}::page::${p.href}::${p.title}`}>
                            <a className="menu-link" href={p.href}>
                              <MenuIcon name={p.iconName} url={p.iconUrl} />
                              <span>{p.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
