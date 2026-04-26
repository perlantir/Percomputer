import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data & Privacy",
  description:
    "Export your data, manage retention policies, and control privacy settings.",
  openGraph: {
    title: "Data & Privacy | Computer",
    description:
      "Export your data, manage retention policies, and control privacy settings.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Data & Privacy | Computer",
    description:
      "Export your data, manage retention policies, and control privacy settings.",
    images: ["/og-image.png"],
  },
};

export default function DataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
