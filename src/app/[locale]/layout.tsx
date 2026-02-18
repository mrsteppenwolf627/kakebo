import { getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/landing";
import "../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Layout.metadata" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com"),
    title: {
      default: t("defaultTitle"),
      template: t("templateTitle"),
    },
    description: t("description"),
    keywords: t("keywords").split(", "),
    authors: [{ name: "Kakebo AI Team" }],
    creator: "Kakebo AI",
    publisher: "Kakebo AI",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.webmanifest",
    themeColor: "#fafaf9",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Kakebo AI",
    },
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
    alternates: {
      canonical: "/",
      languages: {
        "es": "/es",
        "en": "/en",
      },
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      url: "/",
      siteName: "Kakebo AI",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Kakebo AI Dashboard",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      creator: "@kakebo_ai",
      images: ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      "geo.region": "ES",
      "geo.placename": "España",
      "geo.position": "40.4637; -3.7492", // Madrid coordinates approx
      "ICBM": "40.4637, -3.7492",
    },
    verification: {
      google: "Vd8Y8MWGuiMRtCf6QzbzPT83CGcBeLJ3ME3lxeqdN-g",
    },
  };
}

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

import SoftwareAppJsonLd from "@/components/seo/SoftwareAppJsonLd";
import { CookieBanner } from "@/components/landing";

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="overflow-x-hidden" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden max-w-[100vw] bg-sakura text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300 antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <SoftwareAppJsonLd />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <CookieBanner />
          </ThemeProvider>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
