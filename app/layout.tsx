import type { Metadata } from "next";
import { Inter, Pirata_One } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PWARegistrar from "@/components/PWARegistrar";
import ThemeSync from "@/components/ThemeSync";
import { AuthProvider } from "@/components/AuthProvider";
import { buildSiteUrl, siteConfig } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });
const brand = Pirata_One({ subsets: ["latin"], weight: "400", variable: "--font-brand" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  alternates: {
    canonical: buildSiteUrl("/"),
  },
  category: "sports",
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  icons: {
    shortcut: "/favicon.svg",
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: "NhNHQ9nxbnafEu8ltnZaqHlcP6scBj0DRJXLng9TxFw",
  },
  openGraph: {
    type: "website",
    url: buildSiteUrl("/"),
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: buildSiteUrl(siteConfig.ogImage),
        width: 512,
        height: 512,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [buildSiteUrl(siteConfig.ogImage)],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HoopLink",
  },
};

export const viewport = {
  themeColor: "#22d3ee",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${brand.variable} bg-background text-foreground`}>
        <AuthProvider>
          <PWARegistrar />
          <ThemeSync />
          <Navbar />
          <main className="mx-auto min-h-screen w-full max-w-screen-2xl px-3 py-4 pb-20 sm:px-4 md:px-6 md:py-6">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
