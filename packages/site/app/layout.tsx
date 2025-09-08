import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "../contexts/ThemeContext";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Zama FHEVM SDK Quickstart",
  description: "Zama FHEVM SDK Quickstart app",
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
          <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
            <Image
              src="/zama-logo.svg"
              alt="Zama Logo"
              width={120}
              height={120}
            />
          </nav>
          <ThemeProvider>
            <Providers>{children}</Providers>
          </ThemeProvider>
        </main>
      </body>
    </html>
  );
}
