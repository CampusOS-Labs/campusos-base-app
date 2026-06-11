export default function ProtectedLoading() {
  return (
    <div className="flex justify-center pt-6">
      <div className="w-full max-w-[66.666667%] space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
