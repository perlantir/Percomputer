import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Model Agent Platform",
  description:
    "Build, run, and scale autonomous AI workflows. Multi-model, multi-agent orchestration platform with 20+ LLMs.",
  openGraph: {
    title: "Multi-Model Agent Platform — Build, Run & Scale AI Workflows",
    description:
      "Build, run, and scale autonomous AI workflows. Multi-model, multi-agent orchestration platform with 20+ LLMs.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Model Agent Platform — Build, Run & Scale AI Workflows",
    description:
      "Build, run, and scale autonomous AI workflows. Multi-model, multi-agent orchestration platform with 20+ LLMs.",
    images: ["/og-image.png"],
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
