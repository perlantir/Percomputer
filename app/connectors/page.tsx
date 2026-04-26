import type { Metadata } from "next";
import ConnectorsContent from "./connectors-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Connectors",
  description:
    "Manage integrations with external services like Google, Slack, GitHub, Notion, and more.",
  openGraph: {
    title: "Connectors | Computer",
    description:
      "Manage integrations with external services like Google, Slack, GitHub, Notion, and more.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Connectors | Computer",
    description:
      "Manage integrations with external services like Google, Slack, GitHub, Notion, and more.",
    images: ["/og-image.png"],
  },
};

export default function ConnectorsPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Connectors",
          "Manage integrations with external services like Google, Slack, GitHub, Notion, and more.",
          "/connectors"
        )}
      />
      <ConnectorsContent />
    </>
  );
}
