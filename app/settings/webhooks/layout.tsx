import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhooks",
  description:
    "Configure webhooks to receive real-time event notifications from the Multi-Model Agent Platform.",
  openGraph: {
    title: "Webhooks | Computer",
    description:
      "Configure webhooks to receive real-time event notifications from the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Webhooks | Computer",
    description:
      "Configure webhooks to receive real-time event notifications from the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

export default function WebhooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
