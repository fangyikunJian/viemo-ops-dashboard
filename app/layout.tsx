import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Viemo Studio Operations",
    template: "%s · Viemo Studio Operations",
  },
  description:
    "Business relationships and project work for The Viemo Studio, in one operational picture.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
