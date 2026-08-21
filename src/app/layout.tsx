import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynchroMarket - Discover Local Businesses & Live Pulses",
  description: "Find amazing local businesses, stores, and their latest live pulses on SynchroMarket",
  keywords: ["local business", "deals", "map", "discovery", "nearby", "Rwanda", "Kigali", "SynchroMarket"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png?v=3",
    apple: "/icon-192.png?v=3",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SynchroMarket",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

import { SettingsProvider } from '@/contexts/SettingsContext';
import { UserProvider } from '@/contexts/UserContext';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} font-sans antialiased`}
      >
        <UserProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </UserProvider>
        <Script id="sw-register">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.log('SW registration failed:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
