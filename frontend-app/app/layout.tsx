import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notice Decoder - Government Notice Explainer",
  description: "AI-powered government notice explainer and assistant",
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
