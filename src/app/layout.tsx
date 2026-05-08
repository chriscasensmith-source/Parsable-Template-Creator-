import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parsable Template Creator",
  description:
    "Upload photos of paper format sheets and get copy-and-paste instructions ready for Parable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
