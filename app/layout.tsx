import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const texGyre = localFont({
  src: [
    {
      path: '../public/font/texgyreadventor-regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/font/texgyreadventor-italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/font/texgyreadventor-bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/font/texgyreadventor-bolditalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: "--font-tex-gyre",
});

const bakemono = localFont({
  src: [
    {
      path: '../public/font/Bakemono-Stereo-Bold-trial.ttf',
      weight: '700',
      style: 'normal',
    },
    // Add other weights if needed, but user specified Bold
  ],
  variable: "--font-bakemono",
});

export const metadata: Metadata = {
  title: "Access - File Sharing",
  description: "Upload your file and get your link in return.",
  icons: {
    icon: '/icons/Favicon-and-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${texGyre.variable} ${bakemono.variable} font-sans antialiased h-screen flex flex-col bg-[#FAFAFA] overflow-hidden`}
      >
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
