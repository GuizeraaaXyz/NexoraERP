import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Nexora ERP | Pedidos de Venda",
  description: "Sistema de pedidos de venda com fluxo ERP profissional.",
  icons: {
    icon: "/brand/nexora-logo.png",
    shortcut: "/brand/nexora-logo.png",
    apple: "/brand/nexora-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

