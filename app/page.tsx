import type { Metadata } from "next";
import HomeContent from "./home-content";
import { JsonLdServer } from "@/src/components/JsonLd";
import { webPageSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Create and manage AI-powered workflows with the Computer platform. Start a new workflow or revisit recent ones.",
  openGraph: {
    title: "Home | Computer",
    description:
      "Create and manage AI-powered workflows with the Computer platform. Start a new workflow or revisit recent ones.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home | Computer",
    description:
      "Create and manage AI-powered workflows with the Computer platform. Start a new workflow or revisit recent ones.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLdServer
        data={webPageSchema(
          "Home",
          "Create and manage AI-powered workflows with the Computer platform. Start a new workflow or revisit recent ones.",
          "/"
        )}
      />
      <HomeContent />
    </>
  );
}
