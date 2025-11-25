import type { Metadata } from "next";
import {
  Cinzel,
  Rajdhani,
  Share_Tech_Mono as ShareTechMono,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const displaySerif = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ancient-display",
});

const bodySans = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ancient-sans",
});

const statMono = ShareTechMono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ancient-mono",
});

export const metadata: Metadata = {
  title: "Word Battle - Vocabulary Learning Game",
  description: "A vocabulary-learning word-building strategy game. Play crossword-style word games, compete against AI, and learn new words!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displaySerif.variable} ${bodySans.variable} ${statMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
