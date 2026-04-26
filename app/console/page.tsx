import type { Metadata } from "next";
import ConsoleContent from "./console-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Console",
  description:
    "Operator console for inspecting workflows, viewing plan diffs, monitoring provider health, and managing tenants.",
  openGraph: {
    title: "Console | Computer",
    description:
      "Operator console for inspecting workflows, viewing plan diffs, monitoring provider health, and managing tenants.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Console | Computer",
    description:
      "Operator console for inspecting workflows, viewing plan diffs, monitoring provider health, and managing tenants.",
    images: ["/og-image.png"],
  },
};

export default function ConsolePage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Console",
          "Operator console for inspecting workflows, viewing plan diffs, monitoring provider health, and managing tenants.",
          "/console"
        )}
      />
      <ConsoleContent />
    </>
  );
}
