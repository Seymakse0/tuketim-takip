import type { Metadata } from "next";
import "./globals.css";
import { VoyageShell } from "@/components/VoyageShell";

export const metadata: Metadata = {
  title: "Et tüketim kontrolü",
  description: "Mutfak günlük et tüketimi girişi ve raporlar",
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hotelCssUrl = process.env.NEXT_PUBLIC_HOTEL_CSS_URL;

  return (
    <html lang="tr">
      <head>
        {hotelCssUrl ? <link rel="stylesheet" href={hotelCssUrl} /> : null}
      </head>
      <body className="antialiased">
        <VoyageShell>{children}</VoyageShell>
      </body>
    </html>
  );
}
