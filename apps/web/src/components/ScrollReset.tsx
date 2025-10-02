// FILE: apps/web/src/components/ScrollReset.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    // reset scroll on every path change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
