import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CrisisButton from "@/components/CrisisButton";

export const metadata: Metadata = {
  title: "GESA (Global Emotional Support Alliance)",
  description: "Global Emotional Support Alliance platform for therapists and patients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CrisisButton />
      </body>
    </html>
  );
}
