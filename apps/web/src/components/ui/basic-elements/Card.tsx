// FILE: apps/web/src/components/ui/basic-elements/Card.tsx
import { cn } from "../../../lib/cn";
import { HTMLAttributes } from "react";

export default function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn("card", className)} />;
}
