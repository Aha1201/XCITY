import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "XCITY App",
  description: "Created by XCITY team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <SolanaWalletProvider>
          <Navbar />
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
