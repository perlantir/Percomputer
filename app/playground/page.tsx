import type { Metadata } from "next";
import { PlaygroundContent } from "./playground-content";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Interactive testing environment for UI components — buttons, badges, cards, dialogs, forms, and more.",
  openGraph: {
    title: "Playground | Computer",
    description:
      "Interactive testing environment for UI components — buttons, badges, cards, dialogs, forms, and more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlaygroundPage() {
  return <PlaygroundContent />;
}
