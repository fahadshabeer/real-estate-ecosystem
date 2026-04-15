import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import { Providers } from "@/components/state/providers";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EstateFlow | Developer & Broker Ecosystem",
  description:
    "Premium digital ecosystem connecting developer companies with broker networks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${poppins.variable} antialiased`}>
        <Providers>
          {children}
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
