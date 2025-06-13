import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import 'tdesign-react/es/style/index.css';
import { AuthProvider } from "@/contexts/AuthContext";
import Message from "@/app/components/ui/Message";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "数据可视化平台",
  description: "基于next.js的数据可视化平台-来自23级大数据3班王宇盛小组的期末作业",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Message />
      </body>
    </html>
  );
}
