import type { Metadata } from "next";
import WebhooksClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Webhooks",
  description:
    "Configure webhook endpoints to receive real-time event notifications from the Computer platform.",
  twitter: {
    card: "summary",
    title: "Webhooks | Computer",
    description:
      "Configure webhook endpoints to receive real-time event notifications from the Computer platform.",
  },
};

export default function WebhooksPage() {
  return <WebhooksClientPage />;
}
