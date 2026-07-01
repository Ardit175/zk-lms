import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_SCRIPT } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Geometric display face for headings and marketing surfaces — a Google-hosted
// analog to Cal Sans / Clash Display, loaded via next/font (no layout shift).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EduAI - Platforma Moderne e Mesimit",
    template: "%s | EduAI",
  },
  description: "Platforma moderne e menaxhimit te mesimit me inteligjence artificiale, sesione live, dhe certifikata te verifikueshme.",
  keywords: ["LMS", "mesim online", "kurse", "certifikata", "AI", "kuize"],
  authors: [{ name: "EduAI Team" }],
  creator: "EduAI",
  publisher: "Universiteti i Tiranes",
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://edu-ai.com",
    siteName: "EduAI",
    title: "EduAI - Platforma Moderne e Mesimit",
    description: "Platforma moderne e menaxhimit te mesimit me inteligjence artificiale.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduAI - Platforma Moderne e Mesimit",
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
    <html lang="sq" suppressHydrationWarning>
      <head>
        {/* Sets the theme class before first paint to prevent a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
