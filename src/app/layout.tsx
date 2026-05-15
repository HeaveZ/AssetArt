import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/frontend/providers/theme-provider";
import { NuqsProvider } from "@/frontend/providers/nuqs-provider";
import { Toaster } from "@/frontend/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AssetArt — Enterprise asset intelligence",
    template: "%s · AssetArt",
  },
  description:
    "Track every device, license, and lease. Premium asset intelligence for modern IT teams.",
  applicationName: "AssetArt",
  authors: [{ name: "AssetArt" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "AssetArt",
    description: "Enterprise asset intelligence for modern IT teams.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1424" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-surface-muted text-text min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NuqsProvider>
            {children}
            <Toaster />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
