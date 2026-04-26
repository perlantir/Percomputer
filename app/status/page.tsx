import type { Metadata } from "next";
import StatusClientPage from "./client-page";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Real-time system status, provider health, incident history, and uptime metrics for the Computer platform.",
  twitter: {
    card: "summary_large_image",
    title: "System Status | Computer",
    description:
      "Real-time system status, provider health, incident history, and uptime metrics for the Computer platform.",
  },
};

export default function StatusPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "System Status",
          "Real-time system status, provider health, incident history, and uptime metrics for the Computer platform.",
          "/status"
        )}
      />
      <StatusClientPage />
    </>
  );
}
