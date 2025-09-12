import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "../contexts/ThemeContext";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "Zama Sealed Auction Marketplace - Confidential Bidding with FHEVM",
  description: "Experience the world's first fully homomorphic encrypted auction platform. Your bids remain completely private until the auction ends.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-white text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full bg-white z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-2xl mx-auto pb-20 min-w-[850px]">
          <ThemeProvider>
            <Header />
            <Providers>{children}</Providers>
          </ThemeProvider>
        </main>
      </body>
    </html>
  );
}
