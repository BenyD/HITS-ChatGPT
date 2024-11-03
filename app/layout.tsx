// app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClientThemeProvider } from "@/components/ClientThemeProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HITS Chat App",
  description:
    "AI powered chatting application for Hindustan Institute of Technology and Science developed by Beny Dishon.",
  openGraph: {
    title: "HITS Chat App",
    description:
      "AI powered chatting application for Hindustan Institute of Technology and Science developed by Beny Dishon.",
    url: "https://hits.beny.one/",
    siteName: "HITS Chat App",
    images: [
      {
        url: "/android-chrome-192x192.png",
        width: 192,
        height: 192,
        alt: "HITS Chat App Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HITS Chat App",
    description:
      "AI powered chatting application for Hindustan Institute of Technology and Science developed by Beny Dishon.",
    images: ["/android-chrome-192x192.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div>{children}</div>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
