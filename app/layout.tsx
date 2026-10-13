import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AA Jewellers",
  description: "Inventory, orders and sales",
  appleWebApp: { capable: true, title: "AA Jewellers", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        {children}
        <script>{`if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")`}</script>
      </body>
    </html>
  );
}
