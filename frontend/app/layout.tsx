import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KGS car inspection",
  description: "Manage vehicle inspections, payments, reports and more.",
  icons: {
    icon: [{ url: "/small-logo.png?v=4", type: "image/png", sizes: "any" }],
    shortcut: [{ url: "/small-logo.png?v=4", type: "image/png" }],
    apple: [{ url: "/small-logo.png?v=4", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
      >
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
