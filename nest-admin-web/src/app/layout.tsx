import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/stores/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Serif de display para los titulares editoriales de la landing y el login.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nestliving.app"),
  title: {
    default: "Nest Living — Administración residencial simple y humana",
    template: "%s · Nest Living",
  },
  description:
    "Nest Living centraliza pagos, mantenimiento, comunicación, reservas, residentes y métricas financieras en una sola plataforma. Comunidades más claras, conectadas y eficientes.",
  keywords: [
    "administración residencial",
    "software para condominios",
    "gestión de comunidades",
    "administración de condominios",
    "plataforma residencial",
    "pagos de mantenimiento",
    "reservas de amenidades",
    "gestión de residentes",
    "Nest Living",
  ],
  applicationName: "Nest Living",
  authors: [{ name: "Nest Living" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Nest Living",
    title: "Nest Living — Tu comunidad, mejor conectada",
    description:
      "Una forma más clara, humana y eficiente de administrar comunidades residenciales: finanzas, comunicación y operación en un solo lugar.",
    url: "/",
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Nest Living — administración residencial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nest Living — Administración residencial simple y humana",
    description:
      "Pagos, mantenimiento, comunicación, reservas y finanzas de tu comunidad, en una sola plataforma.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
