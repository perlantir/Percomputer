import type { Metadata } from "next";
import SpaceContent from "./space-content";

export const metadata: Metadata = {
  title: "Space",
  description:
    "Collaborate in a shared space. View workflows, memory, artifacts, and settings.",
  openGraph: {
    title: "Space | Computer",
    description:
      "Collaborate in a shared space. View workflows, memory, artifacts, and settings.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Space | Computer",
    description:
      "Collaborate in a shared space. View workflows, memory, artifacts, and settings.",
    images: ["/og-image.png"],
  },
};

export default function SpacePage() {
  return <SpaceContent />;
}
