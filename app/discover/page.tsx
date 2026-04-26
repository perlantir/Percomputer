import type { Metadata } from "next";
import DiscoverContent from "./discover-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Explore curated workflow templates to research, build, analyze, and automate.",
  openGraph: {
    title: "Discover | Computer",
    description:
      "Explore curated workflow templates to research, build, analyze, and automate.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover | Computer",
    description:
      "Explore curated workflow templates to research, build, analyze, and automate.",
    images: ["/og-image.png"],
  },
};

export default function DiscoverPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Discover",
          "Explore curated workflow templates to research, build, analyze, and automate.",
          "/discover"
        )}
      />
      <DiscoverContent />
    </>
  );
}
