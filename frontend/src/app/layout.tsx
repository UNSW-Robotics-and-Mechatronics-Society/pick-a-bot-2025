import { Toaster } from "@/components/ui/toaster";
import { Box } from "@chakra-ui/react";
import type { Metadata } from "next";
import { Anta, Audiowide } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";

export const metadata: Metadata = {
  title: "PICKABOTS | RAMSoc Sumobots 2025",
  description:
    "Vote for your champion and climb the leaderboard as Sumobots battle it out in real time!",
  openGraph: {
    title: "PICKABOTS | RAMSoc Sumobots 2025",
    description:
      "Vote for your champion and climb the leaderboard as Sumobots battle it out in real time!",
    url: "https://pickabots.ramsocunsw.org",
    siteName: "RAMSoc (SUMOBOTS) PICKABOTS 2025",
    images: [
      {
        url: "/og-pickabot.png", // TODO: add og image
        width: 1200,
        height: 630,
        alt: "PICKABOTS - Sumobots 2025",
      },
    ],
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PICKABOTS | RAMSoc Sumobots 2025",
    description:
      "Place your votes on Sumobot matches and earn points as they fight it out!",
    images: ["/og-pickabot.png"], // TODO: add og image
    site: "@ramsoc_unsw",
    creator: "@ramsoc_unsw",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

const anta = Anta({
  subsets: ["latin"],
  weight: "400",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anta.className} ${audiowide.className}`}
    >
      <body>
        <Provider>
          <main>
            <Box textStyle="body">
              {children}
              <Toaster />
            </Box>
          </main>
        </Provider>
      </body>
    </html>
  );
}
