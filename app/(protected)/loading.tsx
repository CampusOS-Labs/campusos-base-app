import { Skeleton } from "@/components/ui/skeleton"
import { PageShell } from "@/components/page-layout"

export default function ProtectedLoading() {
  return (
    <PageShell>
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex justify-center gap-10 border-b border-border pb-8">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </PageShell>
  )
}
