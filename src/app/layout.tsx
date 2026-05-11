import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "GADGET//WIRE";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: `${SITE_NAME} — 毎日のハードガジェット・キュレーション`, template: `%s · ${SITE_NAME}` },
  description: "スマートフォン、GaN 充電器、家電、ウェアラブル、e-bike など、ハードガジェットの最新情報を毎日キュレーション。",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 毎日のハードガジェット・キュレーション`,
    description: "ハードガジェットの最新情報を毎日キュレーション。",
    locale: "ja_JP",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-bg text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
