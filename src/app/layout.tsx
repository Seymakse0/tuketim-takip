import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Et tüketim kontrolü",
  description: "Mutfak günlük et tüketimi girişi ve raporlar",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
