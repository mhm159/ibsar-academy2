import type { Metadata, Viewport } from "next";
import { Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PopupNotificationContainer } from "@/components/site/popup-notification";

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
  title: "أكاديمية إبداع | Ibdaa Academy — تعلّم البرمجة والروبوتيكس والحساب الذهني",
  description:
    "منصة تعليمية متكاملة للأطفال في مصر والعالم العربي. تدريس البرمجة، الروبوتيكس، والحساب الذهني أونلاين مع نخبة المعلمين ونظام دفع محلي ودولي آمن.",
  keywords: [
    "أكاديمية إبداع",
    "Ibdaa Academy",
    "تعليم الأطفال",
    "البرمجة للأطفال",
    "الروبوتيكس",
    "الحساب الذهني",
    "تعليم أونلاين",
    "مصر",
    "العالم العربي",
    "كورسات برمجة",
  ],
  authors: [{ name: "Ibdaa Academy" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "أكاديمية إبداع | Ibdaa Academy",
    description:
      "منصة تعليمية متكاملة للأطفال لتعلّم البرمجة والروبوتيكس والحساب الذهني أونلاين.",
    siteName: "Ibdaa Academy",
    type: "website",
    locale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "أكاديمية إبداع",
    description: "تعلّم البرمجة والروبوتيكس والحساب الذهني للأطفال أونلاين.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1923" },
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
          <Toaster />
          <Sonner position="top-center" dir="rtl" />
          <PopupNotificationContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}

/* TODO(phase-1): Add structured data (JSON-LD) for SEO + Arabic locale metadata.
 * TODO(phase-2): Add dashboard layout group with sidebar once auth flows land.
 */
