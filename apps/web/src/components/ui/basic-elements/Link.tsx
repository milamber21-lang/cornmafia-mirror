// FILE: apps/web/src/components/ui/basic-elements/Link.tsx
import NextLink, { LinkProps } from "next/link";
import { cn } from "../../../lib/cn";
import { AnchorHTMLAttributes } from "react";

export default function Link(
  { className, ...rest }:
  LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>
) {
  return <NextLink {...rest} className={cn(className)} />;
}
