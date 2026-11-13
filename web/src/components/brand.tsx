import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wakati logo: bold stylised W mark + wordmark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" aria-hidden className={cn("h-5 w-7", className)}>
      {/* two overlapping V strokes forming a W */}
      <path
        d="M2 3 L9 21 L15 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8 L21 21 L30 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.72"
      />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Wakati home">
      <span className={dark ? "text-white" : "text-primary"}>
        <LogoMark />
      </span>
      <span className={cn("text-[17px] font-semibold tracking-tight", dark ? "text-white" : "text-heading")}>
        Wakati
      </span>
    </Link>
  );
}
