import type { Metadata } from "next";
import WorkflowContent from "./workflow-content";

export const metadata: Metadata = {
  title: "Workflow",
  description:
    "View workflow details, steps, sources, artifacts, and real-time activity.",
  openGraph: {
    title: "Workflow | Computer",
    description:
      "View workflow details, steps, sources, artifacts, and real-time activity.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workflow | Computer",
    description:
      "View workflow details, steps, sources, artifacts, and real-time activity.",
    images: ["/og-image.png"],
  },
};

export default function WorkflowPage() {
  return <WorkflowContent />;
}
