// FILE: apps/web/src/app/admin/land-plots/check-claim/Client.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button } from "@/components/ui";

export default function CheckClaimClient(props: { initialIndex: string }) {
  const router = useRouter();
  const [index, setIndex] = React.useState<string>(props.initialIndex ?? "");

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = index.trim();
        const qp = v ? `?index=${encodeURIComponent(v)}` : "";
        router.push(`/admin/land-plots/check-claim${qp}`);
      }}
    >
      <Input
        value={index}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndex(e.target.value)}
        placeholder="Enter NFT Index (number)"
        inputMode="numeric"
      />
      <Button type="submit" variant="neutral">Check</Button>
    </form>
  );
}
