import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consola · NestQuest",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
