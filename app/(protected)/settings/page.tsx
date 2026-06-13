import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageSection, PageShell } from "@/components/page-layout";

export default function SettingsPage() {
  return (
    <PageShell>
      <PageHeader title="Settings" description="Manage school account and integrations." />

      <PageSection title="Bank account">
          <p className="text-sm text-muted-foreground">
            Connect a bank account to receive fee payments.
          </p>
          <Dialog>
            <DialogTrigger render={<Button />}>Connect bank account</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Bank Account</DialogTitle>
                <DialogDescription>
                  Enter your bank account details to connect.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="account-name">Account Holder Name</Label>
                  <Input id="account-name" placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="routing-number">Routing Number</Label>
                  <Input id="routing-number" placeholder="021000021" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input id="account-number" placeholder="123456789" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-account">Confirm Account Number</Label>
                  <Input id="confirm-account" placeholder="123456789" />
                </div>
              </div>
              <DialogFooter showCloseButton>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageSection>
    </PageShell>
  );
}
