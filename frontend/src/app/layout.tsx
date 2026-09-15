import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KERB · Preserve the Curve",
  icons: {
    icon: {
      url: "/logo.png",
      sizes: "512x512",
      type: "image/png",
    },
  },
  description:
    "KERB is a steward-assist system that finds and evidences potential track-limit incidents in race video — the AI finds the moment, the steward makes the decision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${barlowCondensed.variable} bg-black font-sans text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
