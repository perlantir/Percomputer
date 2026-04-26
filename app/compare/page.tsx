import type { Metadata } from "next";
import CompareContent from "./compare-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Diff workflows, artifacts, and text side-by-side to track changes and improvements.",
  openGraph: {
    title: "Compare | Computer",
    description:
      "Diff workflows, artifacts, and text side-by-side to track changes and improvements.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare | Computer",
    description:
      "Diff workflows, artifacts, and text side-by-side to track changes and improvements.",
    images: ["/og-image.png"],
  },
};

export default function ComparePage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Compare",
          "Diff workflows, artifacts, and text side-by-side to track changes and improvements.",
          "/compare"
        )}
      />
      <CompareContent />
    </>
  );
}
