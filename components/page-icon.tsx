import { cn } from "@/lib/utils";

export function PageIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
