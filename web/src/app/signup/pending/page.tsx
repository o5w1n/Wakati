"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { Logo } from "@/components/brand";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";

function PendingContent() {
  const searchParams = useSearchParams();
  const confirm = searchParams.get("confirm") === "1";

  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-6 pt-10 text-center">
        <div className="rounded-xl border border-cardline bg-card p-8 shadow-sm">
          <Clock size={22} className="mx-auto text-muted" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-3 text-xl font-bold text-heading">
            {confirm ? "Confirm your email" : "Request pending"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-body">
            {confirm
              ? "Your account was created. If email confirmation is required, check your inbox and confirm, then sign in. If your join wasn’t completed, sign in and use Join with access code again (or contact your Registry)."
              : "Your request to join is with the Registry. You’ll get access as soon as they approve it."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className={btnPrimaryCls}>
              Go to sign in
            </Link>
            <Link href="/get-started" className={btnSecondaryCls}>
              Back to Get started
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Pending() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-page" />}>
      <PendingContent />
    </Suspense>
  );
}
