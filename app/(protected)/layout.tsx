import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}

async function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return children;
}
