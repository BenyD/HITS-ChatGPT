// RootLayout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Import fonts with appropriate weights
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

// Optimized SEO metadata
export const metadata: Metadata = {
  title: "Hindustan Institute of Technology & Science Chat App",
  description:
    "University Chat App powered by AI, answering all your campus-related queries.",
  keywords: ["university", "chatbot", "AI", "campus", "Q&A"],
  openGraph: {
    title: "University Chat App",
    description: "Get instant answers to your campus queries.",
    url: "https://your-university-chat-app.com",
    images: [
      {
        url: "https://your-university-chat-app.com/og-image.jpg",
        width: 800,
        height: 600,
        alt: "University Chat App Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@UniversityChatApp",
    title: "University Chat App",
    description: "Get instant answers to your campus queries.",
    images: ["https://your-university-chat-app.com/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
