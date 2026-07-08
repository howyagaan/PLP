import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premier League Predictions League",
  description: "Live standings and manager scoring for a Premier League predictions league.",
  icons: {
    icon: "/premier-league-logo-symbol.png",
    shortcut: "/premier-league-logo-symbol.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
