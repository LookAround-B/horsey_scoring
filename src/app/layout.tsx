import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Horsey — Equestrian Scoring",
  description: "Horsey: interactive FEI dressage and show jumping scoring sheets with live calculations.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Horsey — Equestrian Scoring",
    description: "Interactive FEI dressage and show jumping scoring sheets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Horsey — Equestrian Scoring",
    description: "Interactive FEI dressage and show jumping scoring sheets.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
