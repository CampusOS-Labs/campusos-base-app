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

  return (
    <div>
      <div className="flex justify-center pt-6">
        <div className="w-full max-w-[66.666667%]">
          <h2 className="text-2xl font-semibold">Welcome to Kidzee, Mundhwa</h2>
        </div>
      </div>
      {children}
    </div>
  );
}
