import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ZK-LMS - Platforma Moderne e Mesimit",
    template: "%s | ZK-LMS",
  },
  description: "Platforma moderne e menaxhimit te mesimit me inteligjence artificiale, sesione live, dhe certifikata te verifikueshme.",
  keywords: ["LMS", "mesim online", "kurse", "certifikata", "AI", "kuize"],
  authors: [{ name: "ZK-LMS Team" }],
  creator: "ZK-LMS",
  publisher: "Universiteti i Tiranes",
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://zk-lms.com",
    siteName: "ZK-LMS",
    title: "ZK-LMS - Platforma Moderne e Mesimit",
    description: "Platforma moderne e menaxhimit te mesimit me inteligjence artificiale.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZK-LMS - Platforma Moderne e Mesimit",
    description: "Platforma moderne e menaxhimit te mesimit me inteligjence artificiale.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
