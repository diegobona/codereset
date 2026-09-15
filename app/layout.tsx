import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://codereset.dev"),
  title: {
    default: "CodeReset — Know when your Codex quota resets",
    template: "%s · CodeReset",
  },
  description:
    "A private Codex quota countdown, reset signal radar, and practical field guide for AI coding limits.",
  applicationName: "CodeReset",
  keywords: [
    "Codex reset",
    "Codex usage limit",
    "Codex weekly limit",
    "AI quota tracker",
  ],
  openGraph: {
    type: "website",
    url: "https://codereset.dev",
    siteName: "CodeReset",
    title: "CodeReset — Know exactly when you can ship again",
    description: "Private quota countdowns and public reset signal tracking for Codex users.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeReset",
    description: "Know exactly when you can ship again.",
  },
};

export const viewport: Viewport = {
  themeColor: "#10120f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
