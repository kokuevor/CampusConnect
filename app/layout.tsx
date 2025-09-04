import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "CampusConnect - Student Delivery Network",
  description: "Connect with fellow students for safe deliveries",
  generator: "CampusConnect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider>
            <AppProvider>{children}</AppProvider>
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
