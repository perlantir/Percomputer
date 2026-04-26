import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Real-time system status, provider health, and incident monitoring for the Multi-Model Agent Platform.",
  openGraph: {
    title: "System Status | Computer",
    description:
      "Real-time system status, provider health, and incident monitoring for the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "System Status | Computer",
    description:
      "Real-time system status, provider health, and incident monitoring for the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
