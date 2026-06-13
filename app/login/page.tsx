import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GalleryVerticalEndIcon } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CampusOS.",
};

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          CampusOS
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
