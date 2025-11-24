// frontend/dashboard/src/app/audit/[obpId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { AuditView } from "@/components/front2/AuditView";
import { useAuditTrail } from "@/hooks/useFront2Hooks";

export default function AuditDetailPage() {
  const params = useParams<{ obpId: string }>();
  const router = useRouter();
  const obpId = params.obpId;

  const { log, isLoading, error, refetch } = useAuditTrail(obpId);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-100">
            Audit detail — {obpId}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Full OBP trail from backend Beckn calls for this dispatch.
          </p>
          {error && <p className="text-[11px] text-red-300 mt-1">{error}</p>}
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-2"
        >
          ← Back
        </button>
      </header>

      <section className="border border-slate-800 rounded-xl bg-[#02091F] px-4 py-4">
        <AuditView
          logsFromBackend={log ? [log] : undefined}
          onRefetch={refetch}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
