import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "聖書通読ナビ | Bible Reading Tracker",
  description: "毎日の聖書通読をサポートするナビゲーションアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={cn(notoSansJP.className, "min-h-screen bg-background antialiased")}>
        {children}
      </body>
    </html>
  );
}
