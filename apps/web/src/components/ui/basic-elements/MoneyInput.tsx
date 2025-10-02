// FILE: apps/web/src/components/ui/basic-elements/MoneyInput.tsx
"use client";

import { cn } from "../../../lib/cn";
import Input from "./Input";
import DropdownMenuSingle from "./DropdownMenuSingle";

export type Currency = "EUR" | "USD" | "ADA" | "ETH" | "BASE";

const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: "EUR €",
  USD: "USD $",
  ADA: "ADA ₳",
  ETH: "ETH Ξ",
  BASE: "BASE",
};

type Props = {
  amount?: string;
  currency?: Currency;
  onAmountChange?: (v: string) => void;
  onCurrencyChange?: (c: Currency) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
};

export default function MoneyInput({
  amount,
  currency = "EUR",
  onAmountChange,
  onCurrencyChange,
  size = "md",
  className,
  disabled,
}: Props) {
  const options = (Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => ({
    value: c,
    label: CURRENCY_LABELS[c],
  }));

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <div style={{ minWidth: 160 }}>
        <DropdownMenuSingle
          options={options}
          value={currency}
          onChange={(v) => onCurrencyChange?.(v as Currency)}
          size={size}
          disabled={disabled}
          ariaLabel="Select currency"
        />
      </div>
      <Input
        size={size}
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => onAmountChange?.(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
