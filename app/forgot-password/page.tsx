import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { OrgBrand } from "@/components/org-brand";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your CampusOS password.",
};

export default async function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
