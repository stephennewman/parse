// File Purpose: This file defines the main layout and structure for all pages in the app, including shared elements like navigation and styles.
// Last updated: 2025-05-21
import React from 'react';
import type { Metadata } from "next";
import { GeistSans as FontSans } from 'geist/font/sans';
import { GeistMono as FontMono } from 'geist/font/mono';
import "./globals.css";

import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Krezzo",
  description: "Capture structured data using voice with Krezzo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          FontSans.variable,
          FontMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
