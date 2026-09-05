import type { Metadata, Viewport } from "next";
import { Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PopupNotificationContainer } from "@/features/shared/popup-notification";
import { CookieConsent } from "@/features/shared/cookie-consent";
import Script from "next/script";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصة درس | Dars Academy — تعلّم البرمجة والروبوتيكس والحساب الذهني",
  description:
    "منصة تعليمية متكاملة للأطفال في مصر والعالم العربي. تدريس البرمجة، الروبوتيكس، والحساب الذهني أونلاين مع نخبة المعلمين ونظام دفع محلي ودولي آمن.",
  keywords: [
    "منصة درس",
    "Dars Academy",
    "تعليم الأطفال",
    "البرمجة للأطفال",
    "الروبوتيكس",
    "الحساب الذهني",
    "تعليم أونلاين",
    "مصر",
    "العالم العربي",
    "كورسات برمجة",
  ],
  authors: [{ name: "Dars Academy" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "منصة درس | Dars Academy",
    description:
      "منصة تعليمية متكاملة للأطفال لتعلّم البرمجة والروبوتيكس والحساب الذهني أونلاين.",
    siteName: "Dars Academy",
    type: "website",
    locale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة درس",
    description: "تعلّم البرمجة والروبوتيكس والحساب الذهني للأطفال أونلاين.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body
        className={`${tajawal.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PopupNotificationContainer />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}

/* TODO(phase-1): Add structured data (JSON-LD) for SEO + Arabic locale metadata.
 * TODO(phase-2): Add dashboard layout group with sidebar once auth flows land.
 */
