import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import ParallaxBackground from "@/components/ParallaxBackground";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ethiofreelance.et";

export const metadata: Metadata = {
  title: {
    default: "EthioFreelance — Ethiopia's #1 Freelancing Platform",
    template: "%s | EthioFreelance",
  },
  description:
    "Ethiopia's premier freelance marketplace. Connect with verified Ethiopian freelancers for IT, design, writing, translation, and more. Pay securely with Chapa in ETB.",
  keywords: [
    "Ethiopia freelance", "Ethiopian freelancers", "hire freelancers Ethiopia",
    "Chapa payment", "ETB payment", "Amharic freelance", "remote work Ethiopia",
    "IT jobs Ethiopia", "graphic design Ethiopia", "freelance jobs Addis Ababa",
  ],
  authors: [{ name: "EthioFreelance" }],
  creator: "EthioFreelance",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  icons: {
    icon: "/circular-logo.png",
    apple: "/circular-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_ET",
    url: siteUrl,
    siteName: "EthioFreelance",
    title: "EthioFreelance — Ethiopia's #1 Freelancing Platform",
    description:
      "Connect with top Ethiopian freelancers. Post jobs, get proposals, and pay securely via Chapa in Ethiopian Birr.",
    images: [
      {
        url: `${siteUrl}/horizontal-logo.png`,
        width: 628,
        height: 195,
        alt: "EthioFreelance — Ethiopia's Freelance Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EthioFreelance — Ethiopia's #1 Freelancing Platform",
    description:
      "Connect with top Ethiopian freelancers. Pay securely with Chapa.",
    images: [`${siteUrl}/horizontal-logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProviderWrapper>
            <ThemeProvider>
              <ParallaxBackground />
              {children}
            </ThemeProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
