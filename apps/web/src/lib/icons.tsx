// FILE: apps/web/lib/icons.tsx
import React from 'react';

/**
 * Lucide icons should be installed as dependency (lucide-react).
 * For brand/custom icons, we provide simple SVG placeholders you can swap later.
 */
export function Icon({ name, color, size = 18 }: { name: string; color?: string; size?: number }) {
  const style: React.CSSProperties = { width: size, height: size, color: color || 'currentColor' };

  // Attempt Lucide dynamic import (bundlers can tree-shake if you map explicitly).
  // For simplicity and safety, use a small explicit map for the common icons.
  const LucideMap: Record<string, React.ReactNode> = {
    'help-circle': <svg viewBox="0 0 24 24" style={style}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 1.5-3 4" fill="none" stroke="currentColor"/><circle cx="12" cy="17" r="1" /></svg>,
    settings: <svg viewBox="0 0 24 24" style={style}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.21 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 5.04 3.2l.06.06a1.65 1.65 0 0 0 1.82.33H7a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.8 5l-.06.06a1.65 1.65 0 0 0-.33 1.82V7c.64.17 1.12.74 1.12 1.42s-.48 1.25-1.12 1.42V10c0 .68-.48 1.25-1.12 1.42Z" /></svg>,
    menu: <svg viewBox="0 0 24 24" style={style}><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" fill="none"/></svg>,
    bitcoin: <svg viewBox="0 0 24 24" style={style}><text x="5" y="18" fontSize="14" fill="currentColor">B</text></svg>,
    'audio-lines': <svg viewBox="0 0 24 24" style={style}><path d="M4 6h16M4 12h12M4 18h8" stroke="currentColor" fill="none"/></svg>,
    headphones: <svg viewBox="0 0 24 24" style={style}><path d="M4 14a8 8 0 0 1 16 0" stroke="currentColor" fill="none"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/></svg>,
    milestone: <svg viewBox="0 0 24 24" style={style}><path d="M4 7h14l2 3-2 3H4z" stroke="currentColor" fill="none"/><path d="M4 7v13" stroke="currentColor"/></svg>,
    loader: <svg viewBox="0 0 24 24" style={style}><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/></svg>,
    newspaper: <svg viewBox="0 0 24 24" style={style}><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" fill="none"/><path d="M7 8h6M7 12h10M7 16h10" stroke="currentColor"/></svg>,
    'message-circle': <svg viewBox="0 0 24 24" style={style}><path d="M21 12a8 8 0 1 1-4-6.9L22 2l-1 5a7.9 7.9 0 0 1 0 5z" stroke="currentColor" fill="none"/></svg>,
    'book-open': <svg viewBox="0 0 24 24" style={style}><path d="M2 5h9v14H2zM13 5h9v14h-9z" stroke="currentColor" fill="none"/></svg>,
    'book-open-check': <svg viewBox="0 0 24 24" style={style}><path d="M2 5h9v14H2zM13 5h9v14h-9z" stroke="currentColor" fill="none"/><path d="M6 12l2 2 3-3" stroke="currentColor" fill="none"/></svg>,
  };

  const BrandMap: Record<string, React.ReactNode> = {
    'brand:instagram': <svg viewBox="0 0 24 24" style={style}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" fill="currentColor" /><circle cx="17" cy="7" r="1.5" /></svg>,
    'brand:twitter': <svg viewBox="0 0 24 24" style={style}><path d="M22 5c-.8.5-1.8.8-2.8 1 1-1 1.6-2 1.8-3.3-1 .7-2.2 1.2-3.4 1.5C16.5 3 15.2 2.5 14 2.5c-2.6 0-4.7 2.1-4.7 4.7 0 .4 0 .7.1 1.1C6.1 8.1 3.3 6.6 1.4 4.2c-.5.8-.7 1.7-.7 2.6 0 1.6.8 3 2 3.8-.7 0-1.4-.2-2-.5v.1c0 2.3 1.7 4.2 3.9 4.7-.4.1-.8.2-1.3.2-.3 0-.6 0-.9-.1.6 2 2.4 3.4 4.5 3.5-1.7 1.3-3.9 2.1-6.2 2.1H0c2.2 1.4 4.8 2.2 7.6 2.2 9.1 0 14-7.5 14-14v-.6C20.6 6.8 21.4 6 22 5z" /></svg>,
    'brand:youtube': <svg viewBox="0 0 24 24" style={style}><path d="M23 12c0-3-1-5-1-5s-1-2-5-2H7C3 5 2 7 2 7s-1 2-1 5 1 5 1 5 1 2 5 2h10c4 0 5-2 5-2s1-2 1-5z" /><polygon points="10,8 16,12 10,16" fill="currentColor" /></svg>,
    'brand:discord': <svg viewBox="0 0 24 24" style={style}><path d="M20 4a18 18 0 0 0-4.5-1.5l-.2.4A16 16 0 0 1 8.7 3L8.5 2.5A18 18 0 0 0 4 4C2 7 1.4 10 1.5 13a18 18 0 0 0 5.4 2.8l.7-1.1a8 8 0 0 1-1.2-.6l.3-.2c2.4 1.1 5.2 1.1 7.6 0l.3.2c-.4.2-.8.4-1.2.6l.7 1.1A18 18 0 0 0 22.5 13c.1-3-1-6-2.5-9z" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /></svg>,
    'custom:corn': <svg viewBox="0 0 24 24" style={style}><path d="M12 2c2 2 3 5 3 8s-1 6-3 8-3-5-3-8 1-6 3-8z" /><path d="M8 10c2 1 6 1 8 0" stroke="currentColor" fill="none"/></svg>,
  };

  const node = LucideMap[name] || BrandMap[name];
  return <span style={{ display: 'inline-flex', alignItems: 'center', color }}>{node ?? null}</span>;
}
