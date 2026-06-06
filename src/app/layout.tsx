import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const titleFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Devices Security Lab V2",
    template: "%s | Devices Security Lab V2",
  },
  description: "Professional private platform for cybersecurity training and portfolio growth.",
  keywords: [
    "cybersecurity",
    "portfolio",
    "nextjs",
    "defensive security",
    "siem",
    "homelab",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Devices Security Lab V2",
    description: "Private cybersecurity workspace + public professional portfolio.",
    url: "/",
    siteName: "Devices Security Lab V2",
    locale: "es_ES",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Devices Security Lab V2" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Devices Security Lab V2",
    description: "Private cybersecurity workspace + public professional portfolio.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${titleFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
