// FILE: apps/web/src/components/ui/basic-elements/Label.tsx
import { cn } from "../../../lib/cn";
import { LabelHTMLAttributes } from "react";

export default function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...rest} className={cn("block text-xs", className)} />;
}
