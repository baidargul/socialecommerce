import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSessionUser } from "@/lib/auth/session";
import { AppProvider } from "@/components/layout/app-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Commerce",
  description: "A mobile social shopping feed with creator posts and one-tap buying.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Social Commerce",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body suppressHydrationWarning>
        <AppProvider user={user}>{children}</AppProvider>
      </body>
    </html>
  );
}
