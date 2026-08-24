import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GymTap",
  description:
    "Acercás el teléfono a la máquina y la serie queda registrada. Sin cuentas, sin formularios y sin depender de la señal del gimnasio.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GymTap" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  // El alto real del visor importa: la acción principal va pegada al pulgar.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
