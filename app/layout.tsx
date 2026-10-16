import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saitowers.in"),
  title: "Sai Towers | Sai Green Woods — Premium Plots, Villas & Apartments in Kopargaon",
  description:
    "Sai Green Woods by Sai Towers — MahaRERA registered NA plots, villas & apartments nestled in lush green landscapes at Kopargaon, Maharashtra. Clear titles, quality construction & on-time possession.",
  keywords: [
    "Sai Towers",
    "Sai Green Woods",
    "plots in Kopargaon",
    "NA plots Shirdi",
    "villas Kopargaon",
    "real estate Ahmednagar",
    "MahaRERA projects",
  ],
  authors: [{ name: "Sai Towers & Developers" }],
  icons: {
    icon: [
      { url: "/logo-mark.png", type: "image/png", sizes: "256x256" },
      { url: "/logo-mark-64.png", type: "image/png", sizes: "64x64" },
    ],
  },
  openGraph: {
    title: "Sai Green Woods — A Royal Green Address in Kopargaon",
    description:
      "Premium NA plots, villas & apartments in 60+ acres of green landscapes at Kopargaon. MahaRERA registered. By Sai Towers.",
    siteName: "Sai Towers",
    type: "website",
    images: [{ url: "/images/hero.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-cream text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
