import type { Metadata } from "next";
import ExamplesContent from "./examples-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema, breadcrumbListSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Browse and run pre-built workflow templates — research, code generation, data processing, analysis, and more.",
  openGraph: {
    title: "Examples | Computer",
    description:
      "Browse and run pre-built workflow templates — research, code generation, data processing, analysis, and more.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Examples | Computer",
    description:
      "Browse and run pre-built workflow templates — research, code generation, data processing, analysis, and more.",
    images: ["/og-image.png"],
  },
};

export default function ExamplesPage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Examples",
          "Browse and run pre-built workflow templates — research, code generation, data processing, analysis, and more.",
          "/examples"
        )}
      />
      <JsonLdServer
        data={breadcrumbListSchema([
          { name: "Home", urlPath: "/" },
          { name: "Examples", urlPath: "/examples" },
        ])}
      />
      <ExamplesContent />
    </>
  );
}
