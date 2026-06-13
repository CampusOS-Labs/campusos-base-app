import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AppShellGate } from "@/components/app-shell-gate";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "KidZee Mundhwa — CampusOS",
    template: "%s | KidZee Mundhwa",
  },
  description: "CampusOS base application for school operations and workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable)}>
      <body>
        <TooltipProvider delay={0}>
          <AppShellGate>{children}</AppShellGate>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
