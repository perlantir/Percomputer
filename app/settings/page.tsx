import type { Metadata } from "next";
import SettingsContent from "./settings-content";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your profile, billing, models, privacy, memory, notifications, API keys, and team.",
  openGraph: {
    title: "Settings | Computer",
    description:
      "Manage your profile, billing, models, privacy, memory, notifications, API keys, and team.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary",
    title: "Settings | Computer",
    description:
      "Manage your profile, billing, models, privacy, memory, notifications, API keys, and team.",
    images: ["/og-image.png"],
  },
};

export default function SettingsPage() {
  return <SettingsContent />;
}
