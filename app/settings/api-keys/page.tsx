import type { Metadata } from "next";
import ApiKeysClientPage from "./client-page";

export const metadata: Metadata = {
  title: "API Keys",
  description:
    "Generate, manage, and monitor API keys for programmatic access to the Computer platform.",
  twitter: {
    card: "summary",
    title: "API Keys | Computer",
    description:
      "Generate, manage, and monitor API keys for programmatic access to the Computer platform.",
  },
};

export default function ApiKeysPage() {
  return <ApiKeysClientPage />;
}
