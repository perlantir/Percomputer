import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status History",
  description:
    "Historical uptime data, incident timelines, and service performance metrics.",
  openGraph: {
    title: "Status History | Computer",
    description:
      "Historical uptime data, incident timelines, and service performance metrics.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Status History | Computer",
    description:
      "Historical uptime data, incident timelines, and service performance metrics.",
    images: ["/og-image.png"],
  },
};

export default function StatusHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
