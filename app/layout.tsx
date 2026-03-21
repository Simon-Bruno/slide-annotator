import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slide Annotator",
  description: "AI-powered lecture slide annotations",
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
