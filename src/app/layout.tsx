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
  metadataBase: new URL("https://saicitybuilders.in"),
  title: "Sai City Builders | Sai Green Woods & Sai Towers — Premium Plots & Apartments in Kopargaon",
  description:
    "Sai City Builders presents Sai Green Woods (MahaRERA-registered NA plots) and the upcoming Sai Towers on MG Road — clear titles, green master plans and on-time possession in Kopargaon, Maharashtra.",
  keywords: [
    "Sai City Builders",
    "Sai Green Woods",
    "Sai Towers Kopargaon",
    "plots in Kopargaon",
    "NA plots Shirdi",
    "flats Kopargaon",
    "real estate Ahmednagar",
    "MahaRERA projects",
  ],
  authors: [{ name: "Sai City Builders" }],
  icons: {
    icon: [
      { url: "/logo-mark.png", type: "image/png", sizes: "256x256" },
      { url: "/logo-mark-64.png", type: "image/png", sizes: "64x64" },
    ],
  },
  openGraph: {
    title: "Sai City Builders — Sai Green Woods & Sai Towers, Kopargaon",
    description:
      "Premium NA plots at Sai Green Woods and signature 2 & 3 BHK homes at Sai Towers — MahaRERA registered, by Sai City Builders.",
    siteName: "Sai City Builders",
    type: "website",
    images: [{ url: "/images/projects/sai-towers-01.jpg" }],
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
