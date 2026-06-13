import { PageHeader, PageShell } from "@/components/page-layout";

export default function LogsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Activity logs"
        description="A record of actions taken across CampusOS."
      />
      <p className="text-sm text-muted-foreground">Activity logs coming soon.</p>
    </PageShell>
  );
}
