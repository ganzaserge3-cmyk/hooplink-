import type { Metadata } from "next";
import { Inter, Pirata_One } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PWARegistrar from "@/components/PWARegistrar";
import ThemeSync from "@/components/ThemeSync";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });
const brand = Pirata_One({ subsets: ["latin"], weight: "400", variable: "--font-brand" });

export const metadata: Metadata = {
  title: "HoopLink - Sports Social Media",
  description: "Connect with athletes, coaches, and scouts",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
    shortcut: "/icon.svg",
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
