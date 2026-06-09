import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";
import { AppShellGate } from "@/components/app-shell-gate";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CampusOS",
    template: "%s | CampusOS",
  },
  description: "CampusOS base application for school operations and workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}>
      <body>
        <TooltipProvider delay={0}>
          <Suspense fallback={<>{children}</>}>
            <AppShellGate>{children}</AppShellGate>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
