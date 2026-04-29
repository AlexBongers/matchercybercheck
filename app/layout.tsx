import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cybercheck — HBO ICT Cyber Security Matching",
  description:
    "Match HBO ICT students with entrepreneurs for 45-minute cyber-security interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
