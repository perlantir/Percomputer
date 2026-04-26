import type { Metadata } from "next";
import StatusHistoryClientPage from "./client-page";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Status History",
  description:
    "Historical system status data, past incidents, and uptime reports for the Computer platform.",
  twitter: {
    card: "summary",
    title: "Status History | Computer",
    description:
      "Historical system status data, past incidents, and uptime reports for the Computer platform.",
  },
};

export default function StatusHistoryPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Status History",
          "Historical system status data, past incidents, and uptime reports for the Computer platform.",
          "/status/history"
        )}
      />
      <StatusHistoryClientPage />
    </>
  );
}
