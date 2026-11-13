import Link from "next/link";
import { Clock } from "lucide-react";
import { btnSecondaryCls } from "@/components/ui";

export default function Pending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm border border-line bg-paper p-8 text-center">
        <Clock size={22} className="mx-auto text-muted" strokeWidth={1.5} />
        <h1 className="mt-3 text-xl font-semibold text-ink">Request pending</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Your request to join <strong className="text-ink">Academic City University</strong> as a
          student is with the Registry. You'll get access as soon as they approve it.
        </p>
        <div className="mt-6">
          <Link href="/login" className={btnSecondaryCls}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
