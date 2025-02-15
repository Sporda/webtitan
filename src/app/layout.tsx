import "@/styles/globals.css";
// import "@/styles/parallax.scss";
// import "@/styles/body.scss";
// import "@/styles/sphereCubeStyle.scss";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "WebTitan",
  description: "WebTitan",
  icons: [{ rel: "icon", url: "/webtitan_32pxWhite.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
