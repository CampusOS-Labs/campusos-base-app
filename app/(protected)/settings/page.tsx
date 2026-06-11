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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-6">
        <h1 className="text-xl text-muted-foreground">Settings</h1>
        <Separator />
        <p>Bank settings</p>
        <Dialog>
          <DialogTrigger render={<Button />}>
            Connect Bank Account
          </DialogTrigger>
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
        <Separator />
      </div>
    </div>
  );
}
