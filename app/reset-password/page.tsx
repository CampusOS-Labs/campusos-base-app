import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { OrgBrand } from "@/components/org-brand";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your CampusOS account.",
};

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--brand-glow),transparent)] bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <OrgBrand variant="login" />
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
