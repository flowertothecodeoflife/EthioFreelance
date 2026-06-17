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

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "EthioFreelance - Ethiopia's #1 Freelancing Platform",
  description:
    "Connect with top Ethiopian freelancers and clients. Find jobs in IT, design, writing, translation, and more. Pay with Chapa.",
  keywords: "Ethiopia freelance, Ethiopian freelancers, Chapa payment, Amharic freelance platform",
  icons: {
    icon: "/circular-logo.png",
    apple: "/circular-logo.png",
  },
  openGraph: {
    title: "EthioFreelance - Ethiopia's #1 Freelancing Platform",
    description:
      "Connect with top Ethiopian freelancers and clients. Find jobs in IT, design, writing, translation, and more. Pay with Chapa.",
    images: [{ url: `${siteUrl}/horizontal-logo.png`, width: 628, height: 195, alt: "EthioFreelance" }],
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
