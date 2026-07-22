import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Flock — Church attendance and ministry care",
    template: "%s · Flock",
  },
  description:
    "Manage worker attendance, congregation insights, service programmes and ministry care from one secure church workspace.",
  applicationName: "Flock",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export const viewport: Viewport = { themeColor: "#101c3d", colorScheme: "light" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
