import type { Metadata } from "next";
import LandingClientPage from "./client-page";
import { JsonLdServer } from "@/src/components/JsonLd";
import { softwareApplicationSchema } from "@/src/lib/structured-data";

export const metadata: Metadata = {
  title: "Multi-Model Agent Platform — Build, Run & Scale AI Workflows",
  description:
    "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
  openGraph: {
    title: "Multi-Model Agent Platform — Build, Run & Scale AI Workflows",
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Model Agent Platform — Build, Run & Scale AI Workflows",
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <>
      <JsonLdServer data={softwareApplicationSchema()} />
      <LandingClientPage />
    </>
  );
}
