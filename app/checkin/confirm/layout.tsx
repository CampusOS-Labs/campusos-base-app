import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm check-in",
  description: "Complete your teacher check-in at Kidzee Mundhwa.",
};

export default function ConfirmCheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
