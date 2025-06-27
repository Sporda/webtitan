import "@/styles/globals.css";
// import "@/styles/parallax.scss";
// import "@/styles/body.scss";
// import "@/styles/sphereCubeStyle.scss";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "./_components/Providers";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "Jan Šporek - Full-stack JavaScript vývojář | WebTitan",
    template: "%s | WebTitan",
  },
  description:
    "Jan Šporek je full-stack JavaScript vývojář specializující se na React, Next.js, Node.js a TypeScript. Nabízím webové aplikace na míru, e-shopy, API integrace a DevOps služby.",
  keywords: [
    "full-stack vývojář",
    "JavaScript vývojář",
    "React vývojář",
    "Next.js expert",
    "Node.js programátor",
    "TypeScript",
    "webové aplikace na míru",
    "e-shop vývoj",
    "API integrace",
    "DevOps",
    "freelance programátor",
    "webový vývojář Czechia",
    "Jan Šporek",
  ],
  authors: [{ name: "Jan Šporek" }],
  creator: "Jan Šporek",
  publisher: "WebTitan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://webtitan.cz"),
  alternates: {
    canonical: "https://webtitan.cz",
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "https://webtitan.cz",
    title: "Jan Šporek - Full-stack JavaScript vývojář | WebTitan",
    description:
      "Full-stack JavaScript vývojář specializující se na React, Next.js, Node.js a TypeScript. Nabízím webové aplikace na míru, e-shopy, API integrace a DevOps služby.",
    siteName: "WebTitan",
    images: [
      {
        url: "/JanSporekProfile.jpg",
        width: 1200,
        height: 630,
        alt: "Jan Šporek - Full-stack JavaScript vývojář",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jan Šporek - Full-stack JavaScript vývojář | WebTitan",
    description:
      "Full-stack JavaScript vývojář specializující se na React, Next.js, Node.js a TypeScript. Nabízím webové aplikace na míru, e-shopy, API integrace a DevOps služby.",
    images: ["/JanSporekProfile.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: [
    { rel: "icon", url: "/webtitan_32pxWhite.ico" },
    { rel: "apple-touch-icon", url: "/webtitanLogo.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={`${GeistSans.variable}`}>
      <head>
        <link rel="canonical" href="https://webtitan.cz" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#32e6f0" />
      </head>
      <body>
        <ToastProvider>
          <Providers>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
