import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product Dashboard",
  description: "A product management dashboard built with Next.js and Supabase By DR-Ninja",
  keywords: ["продукты", "панель приборов", "управление"," инвентарь", "управление продуктами"],
  authors: [{ name: "Mohamed Foad & Mr.Lahony" }],
  creator: "Mohamed Foad & Mr.Lahony",
  publisher: "Dr-Ninja",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
