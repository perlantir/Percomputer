import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/src/components/layout/QueryProvider";
import { Toaster } from "@/src/components/layout/Toaster";
import { CommandPaletteProvider } from "@/src/components/layout/CommandPaletteProvider";
import { KeyboardShortcutsProvider } from "@/src/components/layout/KeyboardShortcutsStore";
import { CommandPalette } from "@/src/components/layout/CommandPalette";
import { KeyboardShortcuts } from "@/src/components/layout/KeyboardShortcuts";
import { PWAProvider } from "@/src/components/PWAProvider";
import { PreloadHints } from "@/src/components/PreloadHints";
import { DatadogRUMProvider } from "@/src/components/layout/DatadogRUMProvider";

import { AppShell } from "@/src/components/layout/AppShell";
import { CursorGlow } from "@/src/components/ui/CursorGlow";
import { NoiseOverlay } from "@/src/components/ui/NoiseOverlay";
import { JsonLdServer } from "@/src/components/JsonLd";
import {
  organizationSchema,
  webSiteSchema,
} from "@/src/lib/structured-data";

/**
 * Inter — optimized Google Font loading
 * - latin subset: only loads Latin glyphs (smallest footprint)
 * - display: swap: prevents FOIT, uses fallback font immediately
 * - adjustFontFallback: automatic fallback sizing to reduce CLS
 * - variable: CSS custom property for use in styles
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-inter",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Computer",
    template: "%s | Computer",
  },
  description:
    "A Perplexity Computer clone — multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
  keywords: [
    "AI",
    "agents",
    "orchestration",
    "multi-model",
    "LLM",
    "workflow",
    "automation",
  ],
  authors: [{ name: "Agent Platform Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Multi-Model Agent Platform",
    title: "Computer — Multi-Model Agent Platform",
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Computer — Multi-Model Agent Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@agentplatform",
    creator: "@agentplatform",
    title: "Computer — Multi-Model Agent Platform",
    description:
      "Multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#191A1A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <PreloadHints />
        {/* Organization + WebSite structured data — site-wide */}
        <JsonLdServer data={[organizationSchema(), webSiteSchema()]} />
      </head>
      <body className="min-h-[100dvh] antialiased">
        <DatadogRUMProvider />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <CommandPaletteProvider>
              <KeyboardShortcutsProvider>
                <PWAProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <CommandPalette />
                  <KeyboardShortcuts />
                  <Toaster />
                  <CursorGlow mode="spotlight" size={320} opacity={0.06} blur={80} stiffness={400} damping={30} />
                  <NoiseOverlay />
                </PWAProvider>
              </KeyboardShortcutsProvider>
            </CommandPaletteProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
