import type { Metadata } from "next";
import DataClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Data & Privacy",
  description:
    "Export your data, manage retention policies, and control privacy settings.",
  twitter: {
    card: "summary",
    title: "Data & Privacy | Computer",
    description:
      "Export your data, manage retention policies, and control privacy settings.",
  },
};

export default function DataPage() {
  return <DataClientPage />;
}
