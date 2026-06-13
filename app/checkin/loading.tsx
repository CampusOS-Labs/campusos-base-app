export default function CheckInLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
