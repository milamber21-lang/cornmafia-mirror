// FILE: apps/web/src/components/ui/basic-elements/FieldError.tsx
import { cn } from "../../../lib/cn";

type Props = { message?: string; className?: string };

export default function FieldError({ message, className }: Props) {
  if (!message) return null;
  return <div className={cn("text-xs mt-1 text-[var(--color-accent)]", className)}>{message}</div>;
}
