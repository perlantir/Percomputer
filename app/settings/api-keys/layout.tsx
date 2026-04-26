import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys",
  description:
    "Generate and manage API keys for programmatic access to the Multi-Model Agent Platform.",
  openGraph: {
    title: "API Keys | Computer",
    description:
      "Generate and manage API keys for programmatic access to the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "API Keys | Computer",
    description:
      "Generate and manage API keys for programmatic access to the Multi-Model Agent Platform.",
    images: ["/og-image.png"],
  },
};

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
